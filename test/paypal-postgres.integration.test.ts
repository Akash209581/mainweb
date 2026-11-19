// @vitest-environment node
import { randomUUID } from "crypto";
import { execFileSync } from "child_process";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { freshDockerDatabase } from "./helpers/paypal-fresh-database";
import { verifyReplayCatalog } from "./helpers/paypal-replay-catalog";

describe.skipIf(process.env.PAYPAL_TEST_DOCKER !== "true")(
  "isolated PostgreSQL migration and concurrency",
  () => {
    let client: PrismaClient;
    let registrationId: string;
    let conferenceId: string;
    let commitState: typeof import("../lib/paypal/service").commitState;
    let replay: Awaited<ReturnType<typeof freshDockerDatabase>> | undefined;
    beforeAll(async () => {
      replay = await freshDockerDatabase();
      const { datasource, migrations, evidence } = replay;
      vi.stubGlobal("fetch", () => {
        throw new Error("Network provider calls are forbidden in PostgreSQL-only tests.");
      });
      try {
        execFileSync(
          process.execPath,
          [path.resolve("node_modules/prisma/build/index.js"), "migrate", "deploy"],
          {
            env: { ...process.env, DATABASE_URL: datasource, DIRECT_URL: datasource },
            stdio: "pipe",
            timeout: 60_000
          }
        );
      } catch {
        throw new Error(
          "Migration failed in the verified fresh database. Inspect the preserved container without exposing connection details."
        );
      }
      client = new PrismaClient({ datasources: { db: { url: datasource } } });
      await verifyReplayCatalog(client, migrations, evidence.containerName);
      // Read-only comparison of the replayed database with all Prisma-modeled objects.
      // Both datasource variables are explicitly bound to this verified fresh target.
      try {
        execFileSync(
          process.execPath,
          [
            path.resolve("node_modules/prisma/build/index.js"),
            "migrate",
            "diff",
            "--from-schema-datasource",
            "prisma/schema.prisma",
            "--to-schema-datamodel",
            "prisma/schema.prisma",
            "--exit-code"
          ],
          {
            env: { ...process.env, DATABASE_URL: datasource, DIRECT_URL: datasource },
            stdio: "pipe",
            timeout: 60_000
          }
        );
      } catch {
        throw new Error(
          "Read-only Prisma schema comparison failed for the preserved fresh test database."
        );
      }
      vi.doMock("@/lib/prisma/client", () => ({ prisma: client }));
      commitState = (await import("../lib/paypal/service")).commitState;
    }, 180_000);
    beforeEach(async () => {
      const conference = await client.conference.create({
        data: {
          slug: randomUUID(),
          name: "Test",
          fullName: "Test Conference",
          description: "Isolated payment test",
          startDate: new Date(),
          endDate: new Date()
        }
      });
      const registration = await client.registration.create({
        data: {
          conferenceId: conference.id,
          fullName: "Test Guest",
          email: "guest@example.test",
          status: "PENDING",
          currency: "USD",
          totalAmountCents: 100
        }
      });
      registrationId = registration.id;
      conferenceId = conference.id;
    });
    afterAll(async () => {
      try {
        if (client && replay)
          await verifyReplayCatalog(
            client,
            replay.migrations,
            replay.evidence.containerName
          );
      } finally {
        await client?.$disconnect();
        vi.doUnmock("@/lib/prisma/client");
        vi.unstubAllGlobals();
      }
    });
    function data() {
      return {
        registrationId,
        provider: "PAYPAL",
        amountCents: 100,
        currency: "USD",
        createRequestId: randomUUID(),
        captureRequestId: randomUUID(),
        merchantId: "MERCHANT12345",
        environment: "sandbox",
        snapshot: { totalAmountCents: 100, currency: "USD" }
      };
    }
    it("enforces one PayPal payment for concurrent creates", async () => {
      const results = await Promise.allSettled([
        client.payment.create({ data: data() }),
        client.payment.create({ data: data() })
      ]);
      expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    });
    it("permits only one concurrent processing lease", async () => {
      const payment = await client.payment.create({ data: data() });
      const claim = () =>
        client.payment.updateMany({
          where: { id: payment.id, version: 0, operationUntil: null },
          data: { operationUntil: new Date(Date.now() + 60_000) }
        });
      const results = await Promise.all([claim(), claim()]);
      expect(results.reduce((sum, result) => sum + result.count, 0)).toBe(1);
      // Exercise the same expiry predicate used by the application, without sleeps.
      await client.payment.update({
        where: { id: payment.id },
        data: { operationUntil: new Date(Date.now() - 60_000) }
      });
      const retry = () =>
        client.payment.updateMany({
          where: {
            id: payment.id,
            version: 0,
            OR: [{ operationUntil: null }, { operationUntil: { lt: new Date() } }]
          },
          data: { operationUntil: new Date(Date.now() + 60_000) }
        });
      expect((await retry()).count).toBe(1);
      expect((await retry()).count).toBe(0);
    });
    it("enforces immutable price/order identity", async () => {
      const payment = await client.payment.create({
        data: { ...data(), paypalOrderId: "ORDER12345678" }
      });
      await expect(
        client.payment.update({ where: { id: payment.id }, data: { amountCents: 1 } })
      ).rejects.toThrow();
      await expect(
        client.payment.update({
          where: { id: payment.id },
          data: { paypalOrderId: "OTHER12345678" }
        })
      ).rejects.toThrow();
    });
    it("enforces event uniqueness and payment foreign keys", async () => {
      const payment = await client.payment.create({ data: data() });
      const id = randomUUID();
      await client.paymentWebhook.create({
        data: { id, paymentId: payment.id, eventType: "PAYMENT.CAPTURE.COMPLETED" }
      });
      await expect(
        client.paymentWebhook.create({
          data: { id, paymentId: payment.id, eventType: "PAYMENT.CAPTURE.COMPLETED" }
        })
      ).rejects.toThrow();
      await expect(
        client.paymentWebhook.create({
          data: {
            id: randomUUID(),
            paymentId: randomUUID(),
            eventType: "PAYMENT.CAPTURE.COMPLETED"
          }
        })
      ).rejects.toThrow();
    });
    for (const field of [
      "paypalOrderId",
      "paypalCaptureId",
      "createRequestId",
      "captureRequestId"
    ] as const)
      it(`enforces unique ${field} across registrations`, async () => {
        const other = await client.registration.create({
          data: {
            conferenceId,
            fullName: "Other Test Guest",
            email: "other@example.test"
          }
        });
        const reference = "TEST" + randomUUID().replaceAll("-", "").toUpperCase();
        await client.payment.create({ data: { ...data(), [field]: reference } });
        await expect(
          client.payment.create({
            data: { ...data(), registrationId: other.id, [field]: reference }
          })
        ).rejects.toMatchObject({ code: "P2002" });
      });
    it("rejects nonexistent registration foreign keys", async () => {
      await expect(
        client.payment.create({ data: { ...data(), registrationId: randomUUID() } })
      ).rejects.toThrow();
    });
    it("rejects invoice/payment registration and money mismatches", async () => {
      const payment = await client.payment.create({ data: data() });
      const other = await client.registration.create({
        data: { conferenceId, fullName: "Other Test Guest", email: "other@example.test" }
      });
      const invoice = {
        paymentId: payment.id,
        registrationId,
        invoiceNumber: randomUUID(),
        amountCents: 100,
        currency: "USD"
      };
      await expect(
        client.invoice.create({ data: { ...invoice, registrationId: other.id } })
      ).rejects.toThrow();
      await expect(
        client.invoice.create({ data: { ...invoice, amountCents: 101 } })
      ).rejects.toThrow();
      await expect(
        client.invoice.create({ data: { ...invoice, currency: "EUR" } })
      ).rejects.toThrow();
      await expect(client.invoice.create({ data: invoice })).resolves.toMatchObject({
        paymentId: payment.id
      });
    });
    it("rejects JSON-null price snapshots and immutable identity changes", async () => {
      await expect(
        client.payment.create({
          data: { ...data(), snapshot: { totalAmountCents: null, currency: null } }
        })
      ).rejects.toThrow();
      const payment = await client.payment.create({ data: data() });
      await expect(
        client.payment.update({
          where: { id: payment.id },
          data: { snapshot: { totalAmountCents: 101, currency: "USD" } }
        })
      ).rejects.toThrow();
      await expect(
        client.payment.update({ where: { id: payment.id }, data: { id: randomUUID() } })
      ).rejects.toThrow();
      await expect(
        client.payment.update({
          where: { id: payment.id },
          data: { registrationId: randomUUID() }
        })
      ).rejects.toThrow();
    });
    it("commits paid registration/outbox and deduplicates events atomically", async () => {
      const payment = await client.payment.create({ data: data() });
      const event = { id: randomUUID(), type: "PAYMENT.CAPTURE.COMPLETED" };
      await commitState(
        payment,
        "PAID",
        "CAPTURE" + randomUUID().replaceAll("-", ""),
        event
      );
      await commitState(payment, "PAID", undefined, event);
      expect(
        (await client.registration.findUniqueOrThrow({ where: { id: registrationId } }))
          .status
      ).toBe("CONFIRMED");
      expect(await client.paymentOutbox.count({ where: { paymentId: payment.id } })).toBe(
        1
      );
      expect(await client.paymentWebhook.count({ where: { id: event.id } })).toBe(1);
    });
    it("rejects stale transitions and does not regress a verified paid state", async () => {
      const payment = await client.payment.create({ data: data() });
      const capture = "CAPTURE" + randomUUID().replaceAll("-", "");
      await commitState(payment, "PAID", capture);
      await expect(commitState(payment, "PENDING")).rejects.toThrow();
      const current = await client.payment.findUniqueOrThrow({
        where: { id: payment.id }
      });
      await commitState(current, "PENDING");
      expect(
        (await client.payment.findUniqueOrThrow({ where: { id: payment.id } })).status
      ).toBe("PAID");
    });
    it("rolls back payment and event writes when confirmation is impossible", async () => {
      const payment = await client.payment.create({ data: data() });
      await client.registration.update({
        where: { id: registrationId },
        data: { status: "CANCELLED" }
      });
      const event = { id: randomUUID(), type: "PAYMENT.CAPTURE.COMPLETED" };
      await expect(
        commitState(payment, "PAID", "CAPTURE" + randomUUID().replaceAll("-", ""), event)
      ).rejects.toThrow();
      expect(
        (await client.payment.findUniqueOrThrow({ where: { id: payment.id } })).status
      ).toBe("PENDING");
      expect(await client.paymentWebhook.count({ where: { id: event.id } })).toBe(0);
      expect(await client.paymentOutbox.count({ where: { paymentId: payment.id } })).toBe(
        0
      );
    });
  }
);

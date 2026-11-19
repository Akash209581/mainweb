import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Authentication required." }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { clerkUserId: userId }, select: { id: true } });
  if (!user) return Response.json({ error: "Account unavailable." }, { status: 401 });

  const encoder = new TextEncoder();
  let cancel = () => {};
  const stream = new ReadableStream({
    start(controller) {
      let stopped = false;
      let pending = false;
      const timer: { interval?: ReturnType<typeof setInterval> } = {};
      const cleanup = () => {
        stopped = true;
        if (timer.interval) clearInterval(timer.interval);
        request.signal.removeEventListener("abort", abort);
      };
      const abort = () => {
        if (stopped) return;
        cleanup();
        controller.close();
      };
      cancel = cleanup;
      request.signal.addEventListener("abort", abort, { once: true });
      if (request.signal.aborted) { abort(); return; }
      const poll = async () => {
        if (stopped || pending) return;
        pending = true;
        try {
          const notifications = await prisma.notification.findMany({
            where: { userId: user.id, status: "SENT", channel: "IN_APP" },
            orderBy: { createdAt: "desc" },
            take: 100
          });
          if (!stopped) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ count: notifications.length, notifications })}\n\n`));
        } catch {
          // Retry transient database failures on the next poll.
        } finally { pending = false; }
      };
      void poll();
      timer.interval = setInterval(poll, 8000);
    },
    cancel() { cancel(); }
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "private, no-store, no-transform", Connection: "keep-alive" }
  });
}

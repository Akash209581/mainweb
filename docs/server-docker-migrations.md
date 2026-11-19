# Server Docker database migrations

`Registration.guestCheckoutHash` missing means the running application is newer than its database schema. The checkout migration adds this field and the supporting payment tables and constraints. Apply the full migration chain; do not add just one column, reset the database, or delete volumes.

Upload the updated Dockerfile, docker-compose.yml, scripts/database-preflight.cjs, and the complete prisma directory to the server. Preserve the server's own .env and Docker database. If the server has custom Docker networks, attach db-migrate to the same networks as next-app.

From /conferences/mainweb:

```sh
docker compose --profile tools build db-migrate
docker compose --profile tools run --rm db-migrate --check
```

The check is read only. It reports the selected database, migration history, pending migrations, and missing checkout fields. A nonzero exit is expected while migrations are pending. It uses DATABASE_URL from the server .env, overriding DIRECT_URL for this maintenance process so Prisma cannot silently select another database.

Confirm the target is the intended server Docker database and take a PostgreSQL backup of that database before continuing:

```sh
docker compose --profile tools run --rm db-migrate --apply
docker compose restart next-app
```

Retry registration after the tool reports the checkout schema is ready. If the preflight reports missing migration history, changed checksums, unfinished migrations, or existing PayPal records requiring review, stop and review the report. Do not baseline or reset blindly. If deployment fails, review migration history before retrying; the checkout migration includes enum changes outside its transaction.

The maintenance service runs only when explicitly invoked. Web startup does not modify the database. The tool does not seed country or conference data, charge payments, or send mail.

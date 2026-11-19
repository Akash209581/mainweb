# Server security checks

The repository publishes the web container only on `127.0.0.1:3001`. Host Nginx proxies `/ICGIT` to that address. This does not change PostgreSQL or its data. Preserve any server-specific Docker networks when updating Compose.

## Apply on the server

After updating the port mapping in the server's docker-compose.yml:

```sh
cd /conferences/mainweb
chmod 600 .env
docker compose up -d --no-deps next-app
docker compose ps next-app
docker compose port next-app 3000
```

The last command must report `127.0.0.1:3001`. A restart alone does not apply a changed port mapping; the container must be recreated. Keep the server's own environment file, database, volumes, and custom networks. Changes to application code additionally require an image rebuild.

## Read-only host checks

```sh
docker ps --format 'table {{.Names}}\t{{.Ports}}'
sudo ss -lntp
sudo ufw status verbose
sudo sshd -T | grep -E '^(passwordauthentication|pubkeyauthentication|permitrootlogin) '
stat -c '%a %U:%G %n' /conferences/mainweb/.env
```

The database should have no public host-port mapping. If host access is necessary, bind it to loopback and use SSH forwarding. Docker-published ports can bypass ordinary UFW rules; do not assume UFW alone makes a published database private.

Only intended services should listen publicly. Confirm key-based SSH access in a second session before changing password authentication or root-login policy. Do not apply a firewall default-deny policy until the actual SSH port is allowed. No firewall or SSH change is automated here.

## Nginx and private files

Use an application public directory as a static root, never the project directory. Do not expose storage, backups, Git metadata, or environment files through an alias. The current /ICGIT/uploads/ alias is intended for public uploads; private submissions and backups must stay outside it.

Return 404 or 403 for sensitive dotfiles, except legitimate ACME challenges under /.well-known/. Add restrictions to the actual matching location: a top-level regex location is bypassed by an existing `location ^~ /ICGIT` prefix. Review the full active Nginx configuration before editing it. Preserve PayPal's allowed script, connection, and frame origins when adjusting CSP.

## Payment and credential boundaries

Keep Sandbox tests separate from real registrations; Sandbox `PAID` is test evidence and does not represent received money. Public PayPal client IDs are expected in browsers. Client secrets, SMTP passwords, database passwords, and admin signing keys must remain server-side and must never use a NEXT_PUBLIC_ prefix.

Use a restricted PostgreSQL runtime role and retain privileged migration credentials only for maintenance. Root access, Docker socket access, or an application-process compromise can expose runtime environment variables even when HTTP requests cannot read .env. Protect SSH credentials, Docker access, backups, and the host accordingly.

Review production dependency audit findings and backups before enabling Live payments. Automated tests and these checks are not proof that a host is uncompromised. Investigating compromise requires host logs, processes, access history, and network configuration.

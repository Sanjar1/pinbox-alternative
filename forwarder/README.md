# Railway forwarder (old poster domain)

Deployed to Railway service `web` on 2026-10-15 when the app moved to Hetzner.
Forwards `https://web-production-370c1.up.railway.app/*` → `https://qr.sirnayalavka.uz/*` (308).
Lives only until every printed poster is replaced; then the owner cancels Railway (TODO OWNER-6).

Deploy (the service's root directory is `app`, so upload THIS folder, not `app/`):

    cd forwarder && railway up -s web -e production -p <project-id> -c

Test locally: `docker run --rm -e PORT=8080 -p 8080:8080 $(docker build -q app)` then
`curl -sI localhost:8080/9586b1` → `308` with `location: https://qr.sirnayalavka.uz/9586b1`.

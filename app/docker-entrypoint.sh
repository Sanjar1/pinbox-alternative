#!/bin/sh
set -eu

# Apply any pending Prisma migrations before starting the server.
# This is idempotent: already-applied migrations are skipped.
npx prisma migrate deploy

# Railway can retain a service-level start command override. Ignore any
# injected args and boot the Next server directly from the container image.
exec npm start -- --hostname 0.0.0.0 --port "${PORT:-3000}"

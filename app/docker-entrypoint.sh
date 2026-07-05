#!/bin/sh
set -eu

# Apply pending Prisma migrations before starting the server.
# Retry to survive a transient DB blip on a serverless cold-start wake, but
# still fail hard after N attempts so a genuinely bad migration cannot replace
# the running container (its healthcheck stays red; Railway keeps the previous
# version live). On an up-to-date DB this is a ~1-3s no-op.
ATTEMPTS=5
i=1
until npx prisma migrate deploy; do
  if [ "$i" -ge "$ATTEMPTS" ]; then
    echo "[entrypoint] migrate deploy FAILED after $ATTEMPTS attempts - aborting boot" >&2
    exit 1
  fi
  echo "[entrypoint] migrate deploy attempt $i failed; retrying in $((i * 2))s" >&2
  sleep $((i * 2))
  i=$((i + 1))
done

echo "[entrypoint] migrations up to date - starting server"
exec npm start -- --hostname 0.0.0.0 --port "${PORT:-3000}"

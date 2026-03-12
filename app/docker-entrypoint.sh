#!/bin/sh
set -eu

# Railway can retain a service-level start command override. Ignore any
# injected args and boot the Next server directly from the container image.
exec npm start -- --hostname 0.0.0.0 --port "${PORT:-3000}"

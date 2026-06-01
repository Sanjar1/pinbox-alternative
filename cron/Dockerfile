# Tiny one-shot image for the Railway "report-cron" service.
# alpine + curl + bash + coreutils (for `date -u +%u/%d`) keeps the build to a
# few seconds, so deploying this never contends with the heavy Next.js web build.
FROM alpine:3.20

RUN apk add --no-cache curl bash coreutils

COPY send-reports.sh /usr/local/bin/send-reports.sh
# Strip any CR (in case the file was checked out with CRLF on Windows) so the
# shebang doesn't become `/usr/bin/env bash\r`, then make it executable.
RUN sed -i 's/\r$//' /usr/local/bin/send-reports.sh && chmod +x /usr/local/bin/send-reports.sh

# Cron services must run once and EXIT. This script POSTs the due report(s) and
# returns; Railway re-runs it on the next scheduled tick.
CMD ["/usr/local/bin/send-reports.sh"]

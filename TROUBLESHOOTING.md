# Troubleshooting

## Common Issues

### Discovery returns mock data
- **Symptom:** Discovery results look synthetic or repetitive.
- **Cause:** `YANDEX_GEOCODER_API_KEY` is not set, so fallback mock mode is used.
- **Solution:** Add a valid Yandex geocoder key to `app/.env` and restart the app.

### Lint error: `no-explicit-any` in rollback service
- **Symptom:** `npm run lint` fails in `src/lib/rollback/service.ts`.
- **Cause:** `data` parameter typed as `any`.
- **Solution:** Replace `any` with `Record<string, unknown>` or a concrete sync type.

### Prisma migration fails
- **Symptom:** `npm run db:migrate` errors out.
- **Cause:** Database connection issue or schema conflict.
- **Solution:** Check `DATABASE_URL`. For clean local reset: delete `prisma/dev.db` and rerun migration.

### Docker Postgres not starting
- **Symptom:** `docker compose up` fails or Postgres exits.
- **Cause:** Port 5432 in use or Docker Desktop not running.
- **Solution:** Ensure Docker Desktop is running, check `docker ps`, then retry `docker compose down -v && docker compose up -d`.

### Login not working in dev
- **Symptom:** Cannot log in or no users exist.
- **Cause:** Database not seeded or wrong credentials.
- **Solution:** Run `npm run db:seed`, or use `DISABLE_AUTH_FOR_TESTING=true` only in local dev.

### Cyrillic text appears garbled
- **Symptom:** Some UI labels show mojibake or broken Cyrillic.
- **Cause:** Encoding mismatch in source files or copied strings.
- **Solution:** Ensure files are saved as UTF-8 and normalize rendered text before display.

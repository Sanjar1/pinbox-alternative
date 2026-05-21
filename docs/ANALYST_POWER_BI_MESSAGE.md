# Analyst Power BI Onboarding

This file has two things:

1. A 4-step Railway runbook you do once to get the connection values
2. A ready-to-send message to your analyst with `[PLACEHOLDERS]` you replace with the real values from step 1

---

## STEP 1 — Get the connection values from Railway (4 clicks, ~3 minutes)

### 1.1 Generate the Postgres public TCP domain

1. Open https://railway.com/project/d1031303-c23f-44b6-9542-33ed8ddc8462
2. Click the **Postgres-Pllz** service card.
3. **Settings** tab → scroll to **Networking** → **TCP Proxy** → click **Generate Public TCP Domain**.
4. Copy the host and port it shows you. Example format:
   - Host: `monorail.proxy.rlwy.net`
   - Port: `12345`  ← yours will be different

Save those — they go in the message as `[HOST]` and `[PORT]`.

### 1.2 Create the `bi_readonly` user

1. Same service → **Database** tab (the custom UI) → **Query** sub-tab.
2. Generate a strong password (16+ chars). One option: open your password manager and use its generator. Save it somewhere safe — you'll send it to the analyst by a different channel (NOT in the same Telegram message as the host/port). Example: `Xk9!mP2qLwQa83vN`
3. Paste this SQL into the Query box, **replace `CHANGEME` with your password**, click **Run query**:

```sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'bi_readonly') THEN
    CREATE ROLE bi_readonly LOGIN PASSWORD 'CHANGEME';
  ELSE
    ALTER ROLE bi_readonly WITH LOGIN PASSWORD 'CHANGEME';
  END IF;
END $$;

GRANT CONNECT ON DATABASE railway TO bi_readonly;
GRANT USAGE ON SCHEMA public TO bi_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO bi_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO bi_readonly;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public FROM bi_readonly;
```

Expected result: no errors. Verify with a second query:
```sql
SELECT rolname FROM pg_roles WHERE rolname = 'bi_readonly';
```
Should return 1 row.

### 1.3 You now have all 4 values

| Placeholder | Value |
|------------|-------|
| `[HOST]`     | from step 1.1 |
| `[PORT]`     | from step 1.1 |
| `[USER]`     | `bi_readonly` (fixed) |
| `[DATABASE]` | `railway` (fixed — Railway default) |
| `[PASSWORD]` | what you set in step 1.2 (send to analyst via a SEPARATE channel from the rest) |

---

## STEP 2 — The message to send your analyst

Copy everything below the dashed line. Replace `[HOST]` and `[PORT]` with real values. **Send the password in a SEPARATE message or by phone — never in the same message as the host.**

---

Привет,

Тебе нужен доступ к нашей базе данных для построения аналитики в Power BI. Все настроено, ниже все необходимые данные и шаги.

## Параметры подключения

| Параметр | Значение |
|----------|----------|
| Тип БД   | PostgreSQL |
| Хост     | `[HOST]` |
| Порт     | `[PORT]` |
| База     | `railway` |
| Логин    | `bi_readonly` |
| Пароль   | *отправлю отдельно* |

> Доступ **только на чтение** (SELECT). Никаких INSERT/UPDATE/DELETE — это безопасно, ты не сможешь случайно что-то изменить.

## Подключение из Power BI Desktop

1. Скачай **Power BI Desktop** (бесплатный) с https://powerbi.microsoft.com/desktop/ если еще не установлен.
2. Открой Power BI Desktop → **Получить данные** → **Базы данных** → **База данных PostgreSQL**.
3. В окне подключения введи:
   - **Сервер:** `[HOST],[PORT]`
     **Важно**: между хостом и портом — **запятая**, не двоеточие. Это особенность Power BI.
     Пример: `monorail.proxy.rlwy.net,12345`
   - **База данных:** `railway`
   - **Режим подключения данных:** Import (быстрее) или DirectQuery (live).
4. Нажми **OK**.
5. На следующем экране **Учетные данные** → вкладка **База данных**:
   - Имя пользователя: `bi_readonly`
   - Пароль: *тот, что я пришлю отдельно*
6. Power BI может предупредить про SSL — нажми **OK**, прокси Railway сам обрабатывает TLS.
7. В **Навигаторе** выбери таблицы (см. ниже что у нас есть).

## Основные таблицы

| Таблица | Что в ней |
|---------|-----------|
| `Store` | 41+ магазинов: `id`, `name`, `address`, `archivedAt` |
| `Feedback` | Каждый голос: `rating` (1–5), `comment`, `createdAt`, `storeId`, `status` |
| `QRCode` | QR-коды каждого магазина: `slug`, `scans` (счетчик), `storeId`. **Slug нельзя менять — он напечатан на постерах.** |
| `MapReview` | Внешние отзывы с Яндекс/2ГИС: `source`, `rating`, `reviewText`, `storeId` |
| `User` | Пользователи системы — не нужно для аналитики голосов |

## Базовые отчеты, которые мы хотим видеть

1. **Голосов по магазинам за период** — bar chart, `count(Feedback.id) by Store.name`, фильтр по `Feedback.createdAt`.
2. **Средняя оценка по магазинам** — bar chart с горизонтальной линией среднего по сети.
3. **Голоса по дням за последние 30 дней** — line chart, `count(Feedback.id) by date(Feedback.createdAt)`.
4. **Конверсия скан → голос** — `QRCode.scans` vs `count(Feedback)` по каждому магазину. Здоровый показатель: 2–5%.
5. **Распределение рейтингов 1–5** — stacked bar по магазинам.
6. **Топ-10 магазинов по голосам** + **Bottom-10 магазинов по средней оценке**.

Все таймстемпы (`createdAt`) в UTC — для Ташкента добавь +5 часов в визуализациях.

## Если что-то не работает

- **Не подключается:** проверь что между хостом и портом запятая, не двоеточие.
- **Permission denied:** значит дали неправильный логин — это `bi_readonly`, не `postgres`.
- **Видишь системные таблицы Прим. `_prisma_migrations`:** игнорируй, они не нужны.

Жду первый дашборд!

---

## STEP 3 — Send the password separately

Use a different channel than where you sent the rest of the message. Options:
- Telegram voice message reading the password aloud
- Phone call
- 1Password / Bitwarden share link (best — auto-expires)

Never paste the password in the same chat as the host/port.

---

## Rollback / lockout the analyst later

To revoke access without deleting anything:
```sql
ALTER ROLE bi_readonly WITH NOLOGIN;
```
To re-enable:
```sql
ALTER ROLE bi_readonly WITH LOGIN;
```

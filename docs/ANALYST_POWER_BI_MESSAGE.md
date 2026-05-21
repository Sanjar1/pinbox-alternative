# Power BI: Подключение аналитика

В этом файле:

1. **Шаги для тебя** (4 клика в Railway, ~3 минуты) — получить значения для подключения
2. **Сообщение аналитику** — копируешь и отправляешь, заменив `[ПЛЕЙСХОЛДЕР]` на реальные значения

---

## ШАГ 1 — Получить данные подключения из Railway

### 1.1 Сгенерировать публичный TCP-домен для Postgres

1. Открой https://railway.com/project/d1031303-c23f-44b6-9542-33ed8ddc8462
2. Кликни на сервис **Postgres-Pllz**.
3. Вкладка **Settings** → пролистай до **Networking** → блок **TCP Proxy** → кнопка **Generate Public TCP Domain**.
4. Скопируй хост и порт, например:
   - Хост: `monorail.proxy.rlwy.net`
   - Порт: `12345`  ← у тебя будет свой

Сохрани их — они идут в сообщение как `[ХОСТ]` и `[ПОРТ]`.

### 1.2 Создать пользователя `bi_readonly`

1. Тот же сервис → вкладка **Database** (кастомный UI Railway) → подвкладка **Query**.
2. Сгенерируй надёжный пароль (16+ символов). Открой 1Password / Bitwarden и нажми "сгенерировать". Пример: `Xk9!mP2qLwQa83vN`. Сохрани его — отправишь аналитику ОТДЕЛЬНЫМ каналом (НЕ в том же сообщении что хост/порт).
3. Вставь этот SQL в поле Query, **замени `CHANGEME` на свой пароль**, нажми **Run query**:

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

Ожидается: ноль ошибок. Проверить можно так:
```sql
SELECT rolname FROM pg_roles WHERE rolname = 'bi_readonly';
```
Должно вернуть 1 строку.

### 1.3 У тебя теперь есть все 5 значений

| Плейсхолдер   | Значение |
|---------------|----------|
| `[ХОСТ]`      | из шага 1.1 |
| `[ПОРТ]`      | из шага 1.1 |
| `[ЛОГИН]`     | `bi_readonly` (фиксировано) |
| `[БАЗА]`      | `railway` (фиксировано — стандарт Railway) |
| `[ПАРОЛЬ]`    | то что ты задал в шаге 1.2 (отправляй аналитику ОТДЕЛЬНЫМ каналом) |

---

## ШАГ 2 — Сообщение для аналитика

Скопируй всё ниже разделительной линии. Замени `[ХОСТ]` и `[ПОРТ]` на реальные значения. **Пароль отправь отдельным сообщением или голосом — никогда в одном сообщении с хостом.**

---

Привет,

Тебе нужен доступ к нашей базе данных для построения аналитики в Power BI. Всё настроено, ниже все необходимые данные и шаги.

## Параметры подключения

| Параметр | Значение |
|----------|----------|
| Тип БД   | PostgreSQL |
| Хост     | `[ХОСТ]` |
| Порт     | `[ПОРТ]` |
| База     | `railway` |
| Логин    | `bi_readonly` |
| Пароль   | *отправлю отдельно* |

> Доступ **только на чтение** (SELECT). Никаких INSERT/UPDATE/DELETE — это безопасно, ты не сможешь случайно что-то изменить.

## Подключение из Power BI Desktop

1. Скачай **Power BI Desktop** (бесплатный) с https://powerbi.microsoft.com/desktop/ если ещё не установлен.
2. Открой Power BI Desktop → **Получить данные** → **Базы данных** → **База данных PostgreSQL**.
3. В окне подключения введи:
   - **Сервер:** `[ХОСТ],[ПОРТ]`
     **Важно**: между хостом и портом — **запятая**, не двоеточие. Это особенность Power BI.
     Пример: `monorail.proxy.rlwy.net,12345`
   - **База данных:** `railway`
   - **Режим подключения данных:** Import (быстрее) или DirectQuery (live).
4. Нажми **OK**.
5. На следующем экране **Учётные данные** → вкладка **База данных**:
   - Имя пользователя: `bi_readonly`
   - Пароль: *тот, что я пришлю отдельно*
6. Power BI может предупредить про SSL — нажми **OK**, прокси Railway сам обрабатывает TLS.
7. В **Навигаторе** выбери таблицы (см. ниже что у нас есть).

## Основные таблицы

| Таблица | Что в ней |
|---------|-----------|
| `Store` | 41+ магазинов: `id`, `name`, `address`, `archivedAt` |
| `Feedback` | Каждый голос: `rating` (1–5), `comment`, `createdAt`, `storeId`, `status` |
| `QRCode` | QR-коды каждого магазина: `slug`, `scans` (счётчик), `storeId`. **Slug нельзя менять — он напечатан на постерах.** |
| `MapReview` | Внешние отзывы с Яндекс/2ГИС: `source`, `rating`, `reviewText`, `storeId` |
| `User` | Пользователи системы — не нужно для аналитики голосов |

## Базовые отчёты, которые мы хотим видеть

1. **Голосов по магазинам за период** — bar chart, `count(Feedback.id) by Store.name`, фильтр по `Feedback.createdAt`.
2. **Средняя оценка по магазинам** — bar chart с горизонтальной линией среднего по сети.
3. **Голоса по дням за последние 30 дней** — line chart, `count(Feedback.id) by date(Feedback.createdAt)`.
4. **Конверсия скан → голос** — `QRCode.scans` vs `count(Feedback)` по каждому магазину. Здоровый показатель: 2–5%.
5. **Распределение рейтингов 1–5** — stacked bar по магазинам.
6. **Топ-10 магазинов по голосам** + **Bottom-10 магазинов по средней оценке**.

Все таймстемпы (`createdAt`) в UTC — для Ташкента добавь +5 часов в визуализациях.

## Альтернатива: HTTP API (если прямое подключение к Postgres не работает)

Если Power BI не подключается к Postgres напрямую — есть резервный путь через HTTP-эндпоинты:

```
GET https://web-production-370c1.up.railway.app/api/analytics/feedback
GET https://web-production-370c1.up.railway.app/api/analytics/feedback?from=2026-05-01&to=2026-05-22
GET https://web-production-370c1.up.railway.app/api/analytics/stores
```

Заголовок авторизации:
```
Authorization: Bearer pinbox-reports-2026-secure
```

В Power BI: **Получить данные** → **Веб** → вставь URL и в **Дополнительно** добавь HTTP-заголовок `Authorization` со значением `Bearer pinbox-reports-2026-secure`.

## Если что-то не работает

- **Не подключается:** проверь что между хостом и портом запятая, не двоеточие.
- **Permission denied:** значит дали неправильный логин — это `bi_readonly`, не `postgres`.
- **Видишь системные таблицы например `_prisma_migrations`:** игнорируй, они не нужны.

Жду первый дашборд!

---

## ШАГ 3 — Пароль отправь отдельно

Используй другой канал, не тот в котором отправил остальную часть сообщения. Варианты:
- Голосовое сообщение в Telegram, читаешь пароль вслух
- Звонок
- 1Password / Bitwarden share-ссылка (лучший вариант — автоматически истекает)

Никогда не вставляй пароль в тот же чат где отправил хост/порт.

---

## Отключить аналитика позже (если понадобится)

Заблокировать вход без удаления роли:
```sql
ALTER ROLE bi_readonly WITH NOLOGIN;
```
Снова разрешить:
```sql
ALTER ROLE bi_readonly WITH LOGIN;
```

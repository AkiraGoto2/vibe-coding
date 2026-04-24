# Break Reminder

Десктопное/веб-приложение для напоминаний о перерывах с упражнениями, авторизацией и панелью администратора.

## ⚡ Быстрый старт (локально)

```bash
pnpm install
cp .env.example .env      # заполните переменные (см. ниже)
pnpm db:migrate           # применить миграции
pnpm dev                  # http://localhost:3000
```

> Если видите "Server error" при входе — не заполнен `DATABASE_URL` или не запущены миграции.

---

## 🚀 Деплой на Vercel

### 1. База данных — Neon (бесплатно)

1. Зарегистрируйтесь на [neon.tech](https://neon.tech)
2. Создайте проект → скопируйте **Pooled connection string** → `DATABASE_URL`
3. Скопируйте **Direct connection string** → `DIRECT_URL`

### 2. Email — Resend (бесплатно)

1. Зарегистрируйтесь на [resend.com](https://resend.com)
2. Добавьте и верифицируйте ваш домен
3. Создайте API Key → `RESEND_API_KEY`
4. Укажите `EMAIL_FROM=noreply@yourdomain.com`

> В dev-режиме (без `RESEND_API_KEY`) OTP-код выводится в консоль сервера — письмо не отправляется.

### 3. Rate Limiting — Upstash (опционально)

1. [upstash.com](https://upstash.com) → создайте Redis базу
2. Скопируйте URL и Token

### 4. Деплой

```bash
# Установите Vercel CLI
npm i -g vercel

# Деплой
vercel

# Применить миграции к продакшен БД
DATABASE_URL="ваш-neon-url" pnpm db:migrate
```

Добавьте все переменные из `.env.example` в **Vercel → Settings → Environment Variables**.

---

## 🗄️ База данных (Neon PostgreSQL)

```bash
pnpm db:migrate   # применить все миграции (продакшен-safe)
pnpm db:studio    # открыть визуальный редактор на localhost:5555
pnpm db:generate  # регенерировать Prisma client после изменений schema
```

Таблицы: `User`, `UserSettings`, `Session`, `VerificationCode`, `Feedback`, `Exercise`

---

## 📧 Верификация email

После регистрации пользователь получает письмо с 6-значным OTP кодом. Без подтверждения email войти нельзя. Код действует 15 минут.

---

## 🛡️ Роль администратора

```bash
pnpm make-admin your@email.com
```

Потом выйти и войти снова. В меню появится **Панель администратора** с:
- Просмотром и управлением обратной связью
- Редактированием упражнений (название, описание, GIF, длительность, категория)

---

## 🧪 Тесты

```bash
pnpm test          # запустить все тесты
pnpm test:watch    # режим наблюдения
```

---

## 🔐 Чеклист безопасности

| Пункт | Статус |
|-------|--------|
| Пароли — bcrypt, cost 12 | ✅ |
| Секреты не в коде | ✅ |
| .env в .gitignore | ✅ |
| Параметризованные запросы (Prisma) | ✅ |
| JWT с expire 30d | ✅ |
| Rate limiting на auth endpoints | ✅ |
| XSS: sanitize пользовательского ввода | ✅ |
| Email верификация | ✅ |
| Timing attack protection (bcrypt) | ✅ |

---

## 🖥️ Как сделать EXE / десктопное приложение

### Быстрый способ — Tauri (рекомендуется)

```bash
# 1. Установить Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 2. macOS: установить Xcode CLI tools
xcode-select --install

# 3. Запустить как десктоп (разработка)
pnpm tauri dev

# 4. Собрать установщик
pnpm tauri build
# → src-tauri/target/release/bundle/
#   Windows: .msi + .exe (NSIS)
#   macOS:   .dmg + .app
#   Linux:   .AppImage + .deb
```

**Windows** — дополнительно нужны:
- [Visual Studio Build Tools 2022](https://aka.ms/vs/17/release/vs_BuildTools.exe) → "Desktop development with C++"
- WebView2 (встроен в Windows 11, для Win10: [скачать](https://developer.microsoft.com/microsoft-edge/webview2/))

### Раздача приложения другим людям

После `pnpm tauri build`:
- **Windows**: отдайте файл `.msi` или папку `nsis/` → пользователь запускает установщик
- **macOS**: отдайте `.dmg` → перетащить в Applications
- **Linux**: отдайте `.AppImage` → `chmod +x && ./app.AppImage`

> ⚠️ **Важно**: приложение требует запущенного Next.js сервера (`pnpm start`) для работы авторизации и БД. Для полностью автономной версии нужно запаковать сервер в sidecar — это отдельная продвинутая настройка.

### Альтернатива — Electron

```bash
npm i -g electron-builder
# Сложнее настроить с Next.js, но не требует Rust
```

---

## Health Check

`GET /api/health` — возвращает статус приложения и БД:
```json
{ "status": "ok", "checks": { "database": { "ok": true, "latencyMs": 12 } } }
```

---

## Структура API

| Метод | Маршрут | Описание |
|-------|---------|----------|
| POST | `/api/auth/register` | Регистрация + отправка OTP |
| POST | `/api/auth/verify-email` | Подтверждение email по OTP |
| POST | `/api/auth/resend-code` | Повторная отправка OTP |
| POST | `/api/auth/login` | Вход |
| POST | `/api/auth/logout` | Выход |
| GET | `/api/auth/me` | Текущий пользователь |
| GET/PATCH | `/api/settings` | Настройки пользователя |
| POST | `/api/feedback` | Форма обратной связи |
| GET | `/api/exercises` | Список упражнений |
| GET | `/api/health` | Health check |
| GET | `/api/admin/feedback` | Все сообщения (ADMIN) |
| PATCH/DELETE | `/api/admin/feedback/[id]` | Управление сообщением (ADMIN) |
| GET/POST | `/api/admin/exercises` | Упражнения (ADMIN) |
| PATCH/DELETE | `/api/admin/exercises/[id]` | Редактирование (ADMIN) |
| GET | `/api/admin/stats` | Статистика (ADMIN) |

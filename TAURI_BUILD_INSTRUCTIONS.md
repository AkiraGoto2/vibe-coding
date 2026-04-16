# Сборка десктопного приложения (Tauri)

## Как это работает

Tauri оборачивает ваш Next.js-сайт в нативное окно приложения. Next.js работает как локальный сервер, Rust-бэкенд управляет окном, треем и уведомлениями.

---

## Шаг 1 — Установите Rust

**macOS / Linux:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
```

**Windows:**  
Скачайте `rustup-init.exe` с https://rustup.rs и запустите.

Проверка:
```bash
rustc --version   # должно вывести: rustc 1.7x.x
cargo --version
```

---

## Шаг 2 — Системные зависимости

### macOS
```bash
xcode-select --install
```

### Windows
1. Установите [Visual Studio Build Tools 2022](https://visualstudio.microsoft.com/visual-cpp-build-tools/)  
   → Выберите компонент: **"Desktop development with C++"**
2. WebView2 уже встроен в Windows 10/11. Если нет — скачайте с [Microsoft](https://developer.microsoft.com/microsoft-edge/webview2/)

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install -y \
  libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev \
  patchelf libssl-dev libgtk-3-dev
```

---

## Шаг 3 — Установите Node.js зависимости и базу данных

```bash
pnpm install
pnpm db:setup
```

---

## Шаг 4 — Запуск в режиме разработки

```bash
pnpm tauri dev
```

Это запустит:
1. `next dev` — Next.js сервер на порту 3000
2. Tauri — нативное окно, которое загружает `http://localhost:3000`

⚠️ Первая сборка Rust занимает 3–5 минут (компилируются зависимости). Последующие — 10–30 секунд.

---

## Шаг 5 — Создание иконок (обязательно перед build)

Папка `src-tauri/icons/` должна содержать иконки. Создайте их из `public/icon.svg`:

```bash
# Установите tauri-cli если ещё нет:
cargo install tauri-cli

# Автогенерация всех размеров иконок из PNG 1024x1024:
cargo tauri icon public/apple-icon.png
```

Это создаст `src-tauri/icons/` с нужными размерами.

---

## Шаг 6 — Продакшен сборка

```bash
pnpm tauri build
```

Готовые файлы в `src-tauri/target/release/bundle/`:
- **Windows:** `msi/` и `nsis/` (установщики)
- **macOS:** `dmg/` и `macos/` (`.app`)
- **Linux:** `appimage/` и `deb/`

---

## Важное ограничение: Next.js режим

Tauri использует статический экспорт Next.js. В `tauri.conf.json` указан `"frontendDist": "../out"`, значит **перед `pnpm tauri build`** нужен `pnpm build` который генерирует папку `out/`.

Но наш проект использует **API Routes** (авторизация, БД) — они не работают в статическом режиме.

### Решение для продакшена:

**Вариант A — Только фронтенд в Tauri (рекомендуется):**  
Запускайте `next start` отдельно (или как системный сервис), а Tauri просто открывает окно браузера на нужный URL.

Измените `tauri.conf.json`:
```json
"build": {
  "devUrl": "http://localhost:3000",
  "frontendDist": "http://localhost:3000"
}
```

**Вариант B — Sidecar сервер:**  
Запаковать `next start` как sidecar в Tauri bundle. Это сложнее, но даёт полностью автономное приложение.

**Вариант C (для разработки):**  
Всегда использовать `pnpm tauri dev` — Next.js и Tauri запускаются вместе.

---

## Диагностика ошибок

| Ошибка | Решение |
|--------|---------|
| `error: linker 'cc' not found` | Linux: `sudo apt install gcc` |
| `WebView2 not found` | Windows: установите WebView2 Runtime |
| `icons not found` | Запустите `cargo tauri icon <png>` |
| `Cannot connect to database` | Запустите `pnpm db:setup` перед сборкой |
| `Port 3000 in use` | `pnpm tauri dev` сам управляет портом |
| Первая сборка очень долгая | Нормально, Rust компилирует зависимости |

---

## Структура Tauri-бэкенда

```
src-tauri/
  src/
    main.rs       — точка входа, регистрация плагинов
    commands.rs   — Tauri команды (таймер, уведомления)
    tray.rs       — системный трей
  Cargo.toml      — Rust зависимости
  tauri.conf.json — конфигурация окна, иконок, bundle
```

## Доступные Tauri команды

| Команда | Описание |
|---------|----------|
| `get_timer_state` | Получить состояние таймера |
| `start_timer` / `pause_timer` | Управление таймером |
| `reset_timer` | Сброс таймера |
| `set_work_duration` | Установить длительность работы |
| `set_break_duration` | Установить длительность перерыва |
| `show_break_window` | Развернуть окно на весь экран |
| `hide_break_window` | Вернуть нормальный размер |
| `complete_break` | Завершить перерыв |
| `toggle_autostart` | Вкл/выкл автозапуск |
| `send_notification` | Системное уведомление |

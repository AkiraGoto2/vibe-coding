# Break Reminder - Tauri Desktop App

Desktop application that reminds you to take exercise breaks every 60 minutes.

## Features

- 60-minute work timer (configurable 15-120 minutes)
- Fullscreen break mode with exercise videos
- 12 different exercises with video guides
- System tray support
- Auto-start with system boot
- Keyboard shortcuts (Space to pause/resume)

## Prerequisites

1. **Rust** - Install from [rustup.rs](https://rustup.rs/)
2. **Node.js** - Version 18+ recommended
3. **pnpm** - Install with `npm install -g pnpm`
4. **Tauri CLI** - Install with `cargo install tauri-cli`

### Windows Additional Requirements
- Microsoft Visual Studio C++ Build Tools
- WebView2 (usually pre-installed on Windows 10/11)

## Project Structure

```
/
├── app/                    # Next.js frontend
├── components/             # React components
├── hooks/                  # React hooks (including Tauri integration)
├── lib/                    # Utilities and exercise data
├── src-tauri/              # Tauri/Rust backend
│   ├── src/
│   │   ├── main.rs         # App entry point
│   │   ├── commands.rs     # Tauri commands
│   │   └── tray.rs         # System tray setup
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri configuration
└── package.json            # Node.js dependencies
```

## Installation

1. Clone the project and install dependencies:
```bash
pnpm install
```

2. Run in development mode:
```bash
pnpm tauri dev
```

3. Build for production:
```bash
pnpm tauri build
```

The built application will be in `src-tauri/target/release/bundle/`

## Configuration

### Timer Settings
- **Work Duration**: 15-120 minutes (default: 60)
- **Break Duration**: 5-30 minutes (default: 10)

### Auto-Start
Enable "Start with System" in settings to automatically launch on boot.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Pause/Resume timer |

## Customizing Exercises

Edit `lib/exercises.ts` to add or modify exercises. Each exercise has:
- `id`: Unique identifier
- `name`: Display name
- `description`: Instructions
- `duration`: Time in seconds
- `videoUrl`: YouTube embed URL
- `category`: "stretch", "strength", "cardio", or "relax"

## Troubleshooting

### Build fails on Windows
Make sure you have Visual Studio Build Tools installed with "Desktop development with C++".

### WebView2 not found
Download and install WebView2 Runtime from Microsoft.

### Timer not working
Check if the app has necessary permissions in Windows Security settings.

## Package Scripts

Add these to your `package.json`:

```json
{
  "scripts": {
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  }
}
```

## License

MIT

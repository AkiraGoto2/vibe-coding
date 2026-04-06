// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod tray;

use tauri::{Manager, WindowEvent};
use tauri_plugin_autostart::MacosLauncher;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .setup(|app| {
            // Setup system tray
            tray::setup_tray(app)?;
            
            // Get the main window
            let window = app.get_webview_window("main").unwrap();
            
            // Check if started with --minimized flag
            let args: Vec<String> = std::env::args().collect();
            if !args.contains(&"--minimized".to_string()) {
                window.show().unwrap();
            }
            
            Ok(())
        })
        .on_window_event(|window, event| {
            // Minimize to tray instead of closing
            if let WindowEvent::CloseRequested { api, .. } = event {
                window.hide().unwrap();
                api.prevent_close();
            }
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_timer_state,
            commands::start_timer,
            commands::pause_timer,
            commands::reset_timer,
            commands::set_work_duration,
            commands::set_break_duration,
            commands::toggle_autostart,
            commands::get_autostart_status,
            commands::show_break_window,
            commands::hide_break_window,
            commands::complete_break,
            commands::send_notification,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

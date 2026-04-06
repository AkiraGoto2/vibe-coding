use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use tauri_plugin_autostart::ManagerExt;
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimerState {
    pub remaining_seconds: u64,
    pub is_running: bool,
    pub is_break_time: bool,
    pub work_duration: u64,    // in minutes
    pub break_duration: u64,   // in minutes
}

impl Default for TimerState {
    fn default() -> Self {
        Self {
            remaining_seconds: 60 * 60, // 60 minutes default
            is_running: true,
            is_break_time: false,
            work_duration: 60,
            break_duration: 10,
        }
    }
}

pub struct AppState {
    pub timer: Mutex<TimerState>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            timer: Mutex::new(TimerState::default()),
        }
    }
}

#[tauri::command]
pub fn get_timer_state(state: tauri::State<'_, AppState>) -> TimerState {
    state.timer.lock().unwrap().clone()
}

#[tauri::command]
pub fn start_timer(state: tauri::State<'_, AppState>) {
    let mut timer = state.timer.lock().unwrap();
    timer.is_running = true;
}

#[tauri::command]
pub fn pause_timer(state: tauri::State<'_, AppState>) {
    let mut timer = state.timer.lock().unwrap();
    timer.is_running = false;
}

#[tauri::command]
pub fn reset_timer(state: tauri::State<'_, AppState>) {
    let mut timer = state.timer.lock().unwrap();
    timer.remaining_seconds = timer.work_duration * 60;
    timer.is_break_time = false;
    timer.is_running = true;
}

#[tauri::command]
pub fn set_work_duration(state: tauri::State<'_, AppState>, minutes: u64) {
    let mut timer = state.timer.lock().unwrap();
    timer.work_duration = minutes;
    if !timer.is_break_time {
        timer.remaining_seconds = minutes * 60;
    }
}

#[tauri::command]
pub fn set_break_duration(state: tauri::State<'_, AppState>, minutes: u64) {
    let mut timer = state.timer.lock().unwrap();
    timer.break_duration = minutes;
}

#[tauri::command]
pub async fn toggle_autostart(app: AppHandle) -> Result<bool, String> {
    let autostart = app.autolaunch();
    
    if autostart.is_enabled().map_err(|e| e.to_string())? {
        autostart.disable().map_err(|e| e.to_string())?;
        Ok(false)
    } else {
        autostart.enable().map_err(|e| e.to_string())?;
        Ok(true)
    }
}

#[tauri::command]
pub async fn get_autostart_status(app: AppHandle) -> Result<bool, String> {
    let autostart = app.autolaunch();
    autostart.is_enabled().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn show_break_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.set_fullscreen(true).map_err(|e| e.to_string())?;
        window.set_always_on_top(true).map_err(|e| e.to_string())?;
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn hide_break_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.set_fullscreen(false).map_err(|e| e.to_string())?;
        window.set_always_on_top(false).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn complete_break(state: tauri::State<'_, AppState>) {
    let mut timer = state.timer.lock().unwrap();
    timer.is_break_time = false;
    timer.remaining_seconds = timer.work_duration * 60;
    timer.is_running = true;
}

#[tauri::command]
pub async fn send_notification(app: AppHandle, title: String, body: String) -> Result<(), String> {
    use tauri_plugin_notification::NotificationExt;
    
    app.notification()
        .builder()
        .title(&title)
        .body(&body)
        .show()
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

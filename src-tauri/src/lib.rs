#[tauri::command]
fn open_social_webview(app: tauri::AppHandle, platform: String, url: String) -> Result<(), String> {
  let label = format!("social-{}", platform);
  let title = format!("{} - Apex HQ", platform.to_uppercase());

  let _window = tauri::webview::WebviewWindowBuilder::new(
    &app,
    label,
    tauri::WebviewUrl::External(url.parse().map_err(|e| format!("invalid url: {}", e))?),
  )
  .title(title)
  .inner_size(1200.0, 800.0)
  .build()
  .map_err(|e| format!("failed to open webview: {}", e))?;

  Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![open_social_webview])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

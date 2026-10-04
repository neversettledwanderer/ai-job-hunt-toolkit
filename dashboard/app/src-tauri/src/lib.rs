use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::Manager;

// Personal, single-machine tool — the backend lives at a fixed path on this
// machine rather than being bundled as a bin resource. If this app is ever
// distributed to another machine, this needs to become a proper sidecar.
//
// node is managed by nvm, which isn't on the PATH that GUI-launched apps get
// from LaunchServices (only interactive shells load nvm's PATH) — so this
// must be an absolute path to the node binary, not just "node".
const NODE_BIN: &str = "/Users/yogeshmistry/.nvm/versions/node/v22.22.2/bin/node";
const SERVER_ENTRY: &str =
    "/Users/yogeshmistry/Documents/GitHub/ai-job-hunt-toolkit/dashboard/server/dist/index.js";
const SERVER_CWD: &str = "/Users/yogeshmistry/Documents/GitHub/ai-job-hunt-toolkit/dashboard/server";

struct BackendProcess(Mutex<Option<Child>>);

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .setup(|app| {
            let child = Command::new(NODE_BIN)
                .arg(SERVER_ENTRY)
                .current_dir(SERVER_CWD)
                .spawn();

            match child {
                Ok(child) => {
                    app.manage(BackendProcess(Mutex::new(Some(child))));
                }
                Err(err) => {
                    eprintln!("Failed to spawn dashboard backend: {err}");
                    app.manage(BackendProcess(Mutex::new(None)));
                }
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                if let Some(backend) = window.app_handle().try_state::<BackendProcess>() {
                    if let Some(mut child) = backend.0.lock().unwrap().take() {
                        let _ = child.kill();
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

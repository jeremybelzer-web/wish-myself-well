/* Curiosities on the desktop: the same app in its own window, with what a browser tab cannot do.
   - Web MIDI on every system (Chromium inside), so MIDI pads, straps and VCV Rack work on a Mac too.
   - The local bridge (bridge-server.js): WebSocket and OSC, for VCV Rack, TouchOSC, Max, Maya or Blender.
   - A File menu for the project file (project.js): New, Open, Save, Save As, with the usual shortcuts.
   Your work is kept in this app's own storage and in .curio files, the same as the web version. */
const { app, BrowserWindow, Menu, dialog, session, shell } = require("electron");
const path = require("path");
const bridge = require("./bridge-server.js");

/* The app's name lives in one place, package.json "productName" (and build.productName for the installer). */
const APP_NAME = require("./package.json").productName;
app.setName(APP_NAME);
/* Work is stored under a fixed folder, so renaming the app never strands anyone's saved work. */
app.setPath("userData", path.join(app.getPath("appData"), "Curiosities"));

const APP_DIR = app.isPackaged ? path.join(process.resourcesPath, "app") : path.join(__dirname, "..");
let win = null;
let server = null;

function run(code) {
  return win && !win.isDestroyed() ? win.webContents.executeJavaScript(code, false) : Promise.resolve(null);
}
/* Call window.<object>.<fn>(...args) in the app. */
function call(object, fn, ...args) {
  return run(`window.${object} ? window.${object}.${fn}(${args.map((a) => JSON.stringify(a)).join(", ")}) : null`);
}

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 920,
    title: APP_NAME,
    backgroundColor: "#f7efe2",
    icon: path.join(APP_DIR, "icon.svg"),
    webPreferences: { contextIsolation: true, sandbox: true },
  });
  win.loadFile(path.join(APP_DIR, "index.html"));
  /* Keep the app's name in the title bar, not the page's own <title>. */
  win.on("page-title-updated", (e) => e.preventDefault());
  /* Links to the web open in the normal browser, never inside the app. */
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  win.on("closed", () => (win = null));
}

const ports = Object.assign({}, bridge.DEFAULTS, bridge.fromEnv(process.env));

function menu() {
  const mac = process.platform === "darwin";
  const project = (fn) => () => call("CuriosityProject", fn);
  return Menu.buildFromTemplate([
    ...(mac ? [{ role: "appMenu" }] : []),
    {
      label: "File",
      submenu: [
        { label: "New Project", accelerator: "CmdOrCtrl+N", click: project("newProject") },
        { label: "Open…", accelerator: "CmdOrCtrl+O", click: project("open") },
        { label: "Save", accelerator: "CmdOrCtrl+S", click: project("save") },
        { label: "Save As…", accelerator: "CmdOrCtrl+Shift+S", click: project("saveAs") },
        { label: "History…", click: () => call("CuriosityProject", "openPanel", "history") },
        { type: "separator" },
        mac ? { role: "close" } : { role: "quit" },
      ],
    },
    { role: "editMenu" },
    {
      label: "Bridge",
      submenu: [
        {
          label: "Connections…",
          click: () =>
            dialog.showMessageBox(win, {
              type: "info",
              title: "Bridge",
              message: server ? "VCV Rack, OSC controllers and tool scripts can move curiosities." : "The bridge is off.",
              detail: server
                ? `WebSocket: ws://127.0.0.1:${ports.wsPort}\nOSC in: 127.0.0.1:${ports.oscIn}  (/curio/set/c/angleHeight 0.42)\nOSC out: ${bridge.outTargets(ports.oscOut, "127.0.0.1").map((t) => t.host + ":" + t.port).join(", ")}  (/curio/value/...)\nOnly this computer can connect.`
                : "Start the app without CURIO_NO_BRIDGE to turn it on.",
            }),
        },
      ],
    },
    { role: "viewMenu" },
    { role: "windowMenu" },
  ]);
}

app.whenReady().then(() => {
  /* MIDI for pads, keyboards, straps and VCV Rack (Chromium asks for it as "midiSysex", even without sysex);
     the File System Access API for saving back to a .curio file. */
  const allowed = new Set(["midi", "midiSysex", "fileSystem", "clipboard-sanitized-write"]);
  session.defaultSession.setPermissionRequestHandler((wc, permission, done) => done(allowed.has(permission)));
  session.defaultSession.setPermissionCheckHandler((wc, permission) => allowed.has(permission));
  Menu.setApplicationMenu(menu());
  createWindow();
  if (!process.env.CURIO_NO_BRIDGE)
    try {
      server = bridge.start({
        ...bridge.fromEnv(process.env),
        appDir: APP_DIR,
        handle: (msg) => call("CurioBridge", "handle", msg),
        values: () => call("CurioBridge", "values").then((v) => v || []),
        log: console.log,
      });
    } catch (e) {
      console.error("bridge:", e.message);
    }
  app.on("activate", () => BrowserWindow.getAllWindows().length === 0 && createWindow());
});

app.on("window-all-closed", () => {
  if (server) server.close();
  if (process.platform !== "darwin") app.quit();
});

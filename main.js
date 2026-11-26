const { app, BrowserWindow, shell, ipcMain, dialog, net } = require("electron");
const { pathToFileURL } = require("url");
const { execFile, spawn } = require("child_process");
const fs = require("fs"), path = require("path");

// ← آدرس گیت‌هاب پیج خودت
const URL_ = "https://txfine.github.io/pasargad-luncher/";
const APP = "4465480";   // Counter-Strike: Global Offensive (Steam app id)
// حالت آفلاین: اول سایت، اگه نشد آخرین نسخه‌ی ذخیره‌شده، اگه اون هم نبود نسخه‌ی داخل خود برنامه
const LOCAL = path.join(__dirname, "index.html");
const CACHE = path.join(app.getPath("userData"), "cache", "index.html");
const trusted = u => String(u).startsWith(URL_) || String(u).startsWith(pathToFileURL(LOCAL).href) || String(u).startsWith(pathToFileURL(CACHE).href);
async function snapshot() {
  try {
    const r = await net.fetch(URL_, { cache: "no-store" });
    if (r.ok) { fs.mkdirSync(path.dirname(CACHE), { recursive: true }); fs.writeFileSync(CACHE, await r.text()); }
  } catch {}
}
const CF = path.join(app.getPath("userData"), "config.json");
let cfg = { gamePath: "", opts: null, playSec: 0, last: 0 };
try { Object.assign(cfg, JSON.parse(fs.readFileSync(CF, "utf8"))); } catch {}
const save = () => { try { fs.writeFileSync(CF, JSON.stringify(cfg)); } catch {} };
const run = (c, a) => new Promise(r => execFile(c, a, { windowsHide: true, maxBuffer: 1 << 24 }, (e, o) => r(o || "")));

// ---------- وضعیت بازی (از هرجا اجرا شده باشه تشخیص می‌دیم) ----------
const PROCS = ["csgo.exe", "cs2.exe"];
let st = { running: false, since: 0 };
async function tick() {
  const o = (await run("tasklist", ["/FO", "CSV", "/NH"])).toLowerCase();
  const r = PROCS.some(p => o.includes('"' + p + '"'));
  if (r && !st.running) st.since = Date.now();
  if (!r && st.running) { cfg.playSec += Math.floor((Date.now() - st.since) / 1000); cfg.last = Date.now(); save(); }
  st.running = r;
}

// ---------- ابزارها ----------
const OK = /^[+-]?[\w.:\/-]+$/;                       // فقط آرگومان‌های امن
const clean = a => (Array.isArray(a) ? a : []).map(String).filter(x => OK.test(x)).slice(0, 40);
async function steamDir() {
  const o = await run("reg", ["query", "HKCU\\Software\\Valve\\Steam", "/v", "SteamPath"]);
  const m = o.match(/SteamPath\s+REG_SZ\s+(.+)/); return m ? m[1].trim().replace(/\//g, "\\") : null;
}
async function launch(extra) {
  const a = clean(extra), sd = await steamDir(), exe = sd && path.join(sd, "steam.exe");
  if (exe && fs.existsSync(exe)) spawn(exe, ["-applaunch", APP, ...a], { detached: true, stdio: "ignore" }).unref();
  else shell.openExternal("steam://run/" + APP + "//" + encodeURIComponent(a.join(" ")));
}
const valid = p => fs.existsSync(path.join(p, "csgo", "cfg")) || fs.existsSync(path.join(p, "game", "csgo", "cfg"));
function cfgDir() {
  for (const s of [["csgo", "cfg"], ["game", "csgo", "cfg"]]) {
    const d = path.join(cfg.gamePath || "", ...s);
    if (cfg.gamePath && fs.existsSync(d)) return d;
  }
  throw new Error("NO_CFG_DIR");
}
async function libs() {
  const sd = await steamDir(); if (!sd) return [];
  const L = [sd];
  try {
    const v = fs.readFileSync(path.join(sd, "steamapps", "libraryfolders.vdf"), "utf8");
    for (const x of v.matchAll(/"path"\s+"([^"]+)"/g)) L.push(x[1].replace(/\\\\/g, "\\"));
  } catch {}
  return L;
}
async function appDir() {                       // از روی manifest خود استیم (دقیق‌ترین راه)
  for (const l of await libs()) {
    try {
      const x = fs.readFileSync(path.join(l, "steamapps", `appmanifest_${APP}.acf`), "utf8").match(/"installdir"\s+"([^"]+)"/);
      if (x) { const p = path.join(l, "steamapps", "common", x[1]); if (fs.existsSync(p)) return p; }
    } catch {}
  }
  return null;
}
async function detect() {
  const a = await appDir(); if (a && valid(a)) return a;
  for (const l of await libs()) for (const n of ["csgo legacy", "Counter-Strike Global Offensive"]) {
    const p = path.join(l, "steamapps", "common", n); if (valid(p)) return p;
  }
  return null;
}

// ---------- IPC (فقط از صفحه‌ی خودمون پذیرفته می‌شه) ----------
const H = (n, f) => ipcMain.handle(n, (e, ...a) => {
  if (!trusted(e.senderFrame.url)) throw new Error("forbidden");
  return f(...a);
});
const NAME = /^[\w][\w .-]*\.cfg$/i;
let win;
H("status", () => ({ running: st.running, playSec: cfg.playSec + (st.running ? Math.floor((Date.now() - st.since) / 1000) : 0) }));
H("cfg:get", () => ({ gamePath: cfg.gamePath, opts: cfg.opts, playSec: cfg.playSec, last: cfg.last }));
H("opts:set", o => { if (o && typeof o === "object") { cfg.opts = o; save(); } });
H("launch", async a => { if (!st.running) await launch(a); });
H("connect", async (ip, port) => {
  if (!/^[\w.-]+$/.test(String(ip)) || !/^\d{1,5}$/.test(String(port))) throw new Error("bad");
  const t = `${ip}:${port}`;
  if (!st.running) throw new Error("GAME_NOT_RUNNING");   // بازی باید باز باشه
  shell.openExternal("steam://connect/" + t);
});
H("close", async () => { for (const p of PROCS) await run("taskkill", ["/F", "/IM", p]); });
H("app:info", async () => { const p = await appDir(); return { installed: !!p, path: p }; });
H("open", u => { u = String(u); if (/^steam:\/\/(install|validate|run|connect)\/[\w.:\/-]+$/.test(u) || /^https:\/\/store\.steampowered\.com\//.test(u)) shell.openExternal(u); });
H("detect", async () => { const p = await detect(); if (p) { cfg.gamePath = p; save(); } return p; });
H("pick", async () => {
  const r = await dialog.showOpenDialog(win, { properties: ["openDirectory"], title: "پوشه‌ی CS:GO (مثلاً csgo legacy)" });
  if (r.canceled) return { error: "لغو شد" };
  let p = r.filePaths[0];
  if (!valid(p) && path.basename(p).toLowerCase() === "csgo" && fs.existsSync(path.join(p, "cfg"))) p = path.dirname(p);
  if (!valid(p)) return { error: "پوشه‌ی csgo/cfg داخل این مسیر پیدا نشد" };
  cfg.gamePath = p; save(); return { path: p };
});
H("cfg:list", () => fs.readdirSync(cfgDir()).filter(f => NAME.test(f)).map(name => ({ name, size: fs.statSync(path.join(cfgDir(), name)).size })));
H("cfg:save", (n, c) => {
  n = path.basename(String(n));
  if (!NAME.test(n) || typeof c !== "string" || c.length > 1e6) throw new Error("bad");
  fs.writeFileSync(path.join(cfgDir(), n), c); return n;
});
H("cfg:del", n => { n = path.basename(String(n)); if (!NAME.test(n)) throw new Error("bad"); fs.unlinkSync(path.join(cfgDir(), n)); });
H("cfg:open", () => shell.openPath(cfgDir()));
H("win", a => { if (a === "min") win.minimize(); else if (a === "max") win.isMaximized() ? win.unmaximize() : win.maximize(); else if (a === "close") win.close(); });

// ---------- پنجره ----------
function create() {
  win = new BrowserWindow({
    width: 1200, height: 760, minWidth: 960, minHeight: 620, frame: false,
    backgroundColor: "#0b0d12", title: "Pasargad Launcher",
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  win.removeMenu();
  win.loadURL(URL_).catch(() => {});
  win.webContents.on("did-fail-load", (e, code, d, url, isMain) => {
    if (!isMain || code === -3 || String(url).startsWith("file:")) return;
    win.loadFile(fs.existsSync(CACHE) ? CACHE : LOCAL);          // آفلاین
  });
  win.webContents.on("did-finish-load", () => { if (win.webContents.getURL().startsWith(URL_)) snapshot(); });
  const ext = (e, url) => { if (url.startsWith("steam://") || !trusted(url)) { e.preventDefault(); if (/^(https?:|steam:)/.test(url)) shell.openExternal(url); } };
  win.webContents.on("will-navigate", ext);
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^(https?:|steam:)/.test(url)) shell.openExternal(url); return { action: "deny" }; });
}
// ---------- آپدیت خودکار برنامه (از GitHub Releases) ----------
function setupUpdates() {
  if (!app.isPackaged || process.env.PORTABLE_EXECUTABLE_DIR) return;   // نسخه‌ی Portable آپدیت خودکار نداره
  const { autoUpdater } = require("electron-updater");
  autoUpdater.autoDownload = true;
  autoUpdater.on("error", () => {});
  autoUpdater.on("update-downloaded", async info => {
    const r = await dialog.showMessageBox(win, {
      type: "info", buttons: ["الان آپدیت کن", "بعداً"], defaultId: 0, cancelId: 1,
      title: "آپدیت لانچر", message: `نسخه‌ی ${info.version} آماده‌ست.`, detail: "برنامه بسته و دوباره باز می‌شه."
    });
    if (r.response === 0) autoUpdater.quitAndInstall();               // «بعداً» هم موقع بستن برنامه نصب می‌شه
  });
  const chk = () => autoUpdater.checkForUpdates().catch(() => {});
  chk(); setInterval(chk, 6 * 3600 * 1000);
}
app.whenReady().then(() => { create(); tick(); setInterval(tick, 2000); setupUpdates(); });
app.on("window-all-closed", () => app.quit());

<div align="center">

<img src="icon.ico" width="96" alt="Pasargad Launcher" />

# Pasargad Launcher

**لانچر رسمی تیم پاسارگاد برای Counter-Strike: Global Offensive**
*The official Pasargad Team launcher for CS:GO*

[![Release](https://img.shields.io/github/v/release/TxFiNE/pasargad-luncher?style=for-the-badge&color=e4262c)](https://github.com/TxFiNE/pasargad-luncher/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/TxFiNE/pasargad-luncher/total?style=for-the-badge&color=35f08a)](https://github.com/TxFiNE/pasargad-luncher/releases)
[![License](https://img.shields.io/github/license/TxFiNE/pasargad-luncher?style=for-the-badge)](LICENSE)
![Platform](https://img.shields.io/badge/platform-Windows-0078D6?style=for-the-badge&logo=windows)
![Electron](https://img.shields.io/badge/Electron-33-47848F?style=for-the-badge&logo=electron)

[⬇️ دانلود / Download](https://github.com/TxFiNE/pasargad-luncher/releases/latest) ·
[🐞 گزارش باگ / Report a bug](https://github.com/TxFiNE/pasargad-luncher/issues/new/choose) ·
[💡 پیشنهاد / Suggest](https://github.com/TxFiNE/pasargad-luncher/issues/new/choose)

</div>

---

## 🇮🇷 فارسی

### امکانات

- 🎮 **کتابخانه و اجرای بازی** – اجرای CS:GO با گزینه‌های راه‌اندازی دلخواه و نمایش وضعیت اجرا و مدت زمان بازی
- 🌐 **لیست سرورها** – اتصال سریع به سرورهای تیم، فقط وقتی بازی باز است
- ⬇️ **دانلود CS:GO و CS:S v34** – لینک‌های نصب و اعتبارسنجی فایل‌ها
- 📰 **اخبار تیم** – آخرین اطلاعیه‌ها داخل خود برنامه
- 🧩 **مدیریت CFG** – ساخت، ویرایش، ذخیره و حذف فایل‌های `.cfg` مستقیم داخل پوشه‌ی بازی
- 🔍 **تشخیص خودکار مسیر بازی** از روی Steam (پشتیبانی از چند Library)
- 📴 **حالت آفلاین** – اگر اینترنت نبود، آخرین نسخه‌ی ذخیره‌شده یا نسخه‌ی داخلی برنامه باز می‌شود
- 🔄 **آپدیت خودکار** از طریق GitHub Releases (نسخه‌ی نصبی)

### نصب

1. از صفحه‌ی [Releases](https://github.com/TxFiNE/pasargad-luncher/releases/latest) یکی از دو فایل را دانلود کنید:
   - `Pasargad-Launcher-Setup-x.y.z.exe` ← نسخه‌ی نصبی (با آپدیت خودکار)
   - `Pasargad-Launcher-Portable-x.y.z.exe` ← نسخه‌ی قابل‌حمل (بدون نصب، بدون آپدیت خودکار)
2. اجرا کنید. اگر Windows SmartScreen هشدار داد، روی **More info ← Run anyway** بزنید (برنامه امضای دیجیتال پولی ندارد).
3. مطمئن شوید Steam نصب است و CS:GO در Library شما وجود دارد.

### پیش‌نیازها

- Windows 10 / 11
- Steam + بازی Counter-Strike: Global Offensive

---

## 🇬🇧 English

### Features

- **Library & launch** – start CS:GO with custom launch options; live running state and play-time tracking
- **Server list** – one-click connect to team servers (only while the game is running)
- **Downloads** – CS:GO and CS:S v34 install/validate links
- **Team news** – announcements shown inside the app
- **CFG manager** – create, edit, save and delete `.cfg` files directly in the game folder
- **Auto-detect game path** via Steam manifests and multiple libraries
- **Offline mode** – falls back to the last cached UI, then the bundled one
- **Auto-update** via GitHub Releases (installer build)

### Install

Download the installer or portable `.exe` from [Releases](https://github.com/TxFiNE/pasargad-luncher/releases/latest). Windows may show a SmartScreen warning because the app is not code-signed: choose **More info → Run anyway**.

---

## 🛠 توسعه / Development

```bash
git clone https://github.com/TxFiNE/pasargad-luncher.git
cd pasargad-luncher
npm install
npm start          # run in development
npm run build      # build Windows installer + portable into dist/
```

Requires Node.js 20+.

### معماری / Architecture

| File | Role |
|------|------|
| `main.js` | Electron main process: Steam detection, game launch, CFG file ops, IPC, auto-update |
| `preload.js` | Safe `contextBridge` API exposed to the UI as `window.pasargad` |
| `index.html` | The whole UI (served from GitHub Pages, with cached + bundled offline fallbacks) |

Security notes: `contextIsolation` on, `nodeIntegration` off, `sandbox` on; IPC calls are accepted only from trusted origins; launch arguments and CFG file names are whitelisted. See [SECURITY.md](SECURITY.md).

The UI is loaded from `https://txfine.github.io/pasargad-luncher/`, so updating `index.html` on the `main` branch updates the UI for every user without a new release.

## 🤝 مشارکت / Contributing

PRs are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).

## 📄 License

[MIT](LICENSE) © Pasargad Team

> Pasargad Launcher is a fan/community tool and is not affiliated with or endorsed by Valve Corporation. Counter-Strike and Steam are trademarks of Valve Corporation.

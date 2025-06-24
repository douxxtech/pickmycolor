# Pick My Color

A **lightweight, cross-platform color picker desktop utility** built with Electron. Instantly pick any color on your screen using a global hotkey and get its HEX/RGB value copied to your clipboard — complete with a visual preview and magnification tool.

---

## Features

* **Global Hotkey** (`Ctrl+Shift+C`) to start picking any color
* **Magnifier Lens** to zoom into pixels around your cursor
* **Live Preview** of the currently hovered color (HEX & RGB)
* **Automatic Clipboard Copying** of selected color
* **On-Screen Notification** after picking
* **Cross-platform Support** (Windows, macOS, Linux)

---

## Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) >= 14
* [Git](https://git-scm.com/)
* Electron CLI (`npm install -g electron`)

### Installation

```bash
git clone https://github.com/douxxtech/pickmycolor
cd pickmycolor
npm install
```

### Run in Development

```bash
npm start
```

### Build for Production

```bash
npm run build
```

Built apps will be output in the `dist/` folder, using `electron-builder`.

---

## Usage

* Launch the app. It will reside in the system tray.
* Click on the tray icon or use the global shortcut `Ctrl+Shift+C` to activate the overlay.
* Hover over any area of your screen to preview colors.
* Click to select a color. Its HEX code will be copied to the clipboard, and a notification will appear.

> Right-click or press `Ctrl+Shift+C` to cancel picking.

---

## Packaging Targets

| Platform | Target         |
| -------- | -------------- |
| Windows  | NSIS Installer |
| macOS    | Native .app    |
| Linux    | AppImage       |

Edit `package.json > build` for further customization.

---

## 📜 License

Licensed under [NSDv1.0](LICENSE)

---

<a align="center" href="https://github.com/douxxtech" target="_blank">
<img src="https://madeby.douxx.tech"></img>
</a>

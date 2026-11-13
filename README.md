# WinClean Analyzer

[![Electron](https://img.shields.io/badge/Electron-45-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Windows](https://img.shields.io/badge/Windows-10%20%2F%2011-0078D6?logo=windows&logoColor=white)](https://www.microsoft.com/windows)
[![GPL-3.0](https://img.shields.io/badge/Licencia-GPL--3.0-blue)](LICENSE)

[Español](#español) · [English](#english)

---

## Español

### Índice

- [Descripción](#descripción)
- [Características](#características)
- [Stack tecnológico](#stack-tecnológico)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Requisitos](#requisitos)
- [Ejecución](#ejecución)
- [Compilación e instalador](#compilación-e-instalador)
- [Aviso importante](#aviso-importante)
- [Licencia](#licencia)

### Descripción

**WinClean Analyzer** es una utilidad de escritorio para **Windows 10/11** que reúne limpieza de disco, monitor de procesos y gestión de programas de inicio en una interfaz oscura tipo *glassmorphism*. Está construida con **Electron**, HTML, CSS y JavaScript, y usa **PowerShell** para consultar el sistema.

### Características

**Limpiador de disco**

- **Temporales de usuario** (`%TEMP%`) y **de Windows** (`C:\Windows\Temp`).
- **Papelera de reciclaje**.
- **Carpeta de descargas**: analiza y elimina archivos acumulados.
- **Prefetch** (`C:\Windows\Prefetch`) y **logs del sistema** (`C:\Windows\Logs`).
- **Caché de Chrome y Edge**.
- **Flush de DNS**.

**Administrador de tareas**

- Lista en tiempo real de los procesos que más RAM consumen (por encima de 10 MB).
- Búsqueda instantánea para filtrar procesos.
- Terminación forzada con `taskkill`.

**Gestor de inicio**

- Lista las aplicaciones registradas para arrancar con Windows y ayuda a detectar las innecesarias.

**Panel de recomendaciones**

- Resume el espacio recuperable y sugiere qué limpiar según el volumen de basura detectado.

### Stack tecnológico

| Capa | Tecnología |
|---|---|
| Shell de escritorio | Electron 45 (runtime Node.js 24) |
| Interfaz | HTML5, CSS3 (Grid, Flexbox, *backdrop-filter*, animaciones) y JavaScript ES6+ |
| Sistema | APIs de Node (`fs`, `child_process`, estadísticas del SO) y scripts de PowerShell |
| Seguridad | `preload.js` con `contextBridge` y aislamiento de contexto |
| Instalador | electron-builder e Inno Setup 7 |

### Estructura del proyecto

```text
WinClean-Analyzer/
├── src/
│   ├── main/
│   │   ├── main.js          # Proceso principal de Electron e IPC
│   │   └── preload.js       # Puente seguro con contextBridge
│   └── renderer/
│       ├── index.html       # Interfaz
│       ├── renderer.js      # Lógica de la UI
│       ├── styles.css       # Tema OLED y glassmorphism
│       └── assets/icon.png
├── scripts/
│   ├── build-installer.js   # Empaquetado con Inno Setup
│   └── generate-icon.py     # Icono .ico multi-resolución
├── installer/winclean-analyzer.iss
├── build/                    # Iconos generados
├── package.json
├── LICENSE
└── README.md
```

### Requisitos

- **Windows 10/11 x64** (el análisis de sistema usa rutas y comandos de Windows).
- **Node.js 20 o superior** para desarrollo; el ejecutable final lleva su propio runtime.
- **Inno Setup 7** solo si vas a generar el instalador.
- Permisos de administrador para limpiar carpetas del sistema y terminar ciertos procesos.

### Ejecución

```bash
git clone https://github.com/alberto2005-coder/WinClean-Analyzer.git
cd WinClean-Analyzer
npm install
npm start
```

### Compilación e instalador

```bash
npm run dist           # binarios + instalador en dist/
npm run dist:portable  # versión portable
npm run build:icon     # regenerar build/icon.ico desde build/icon.png
```

Resultados en `dist/`:

- `dist/WinClean-Analyzer-Setup-v1.0.0.exe` — instalador con compresión LZMA2, selección de idioma español/inglés, accesos directos y desinstalador.
- `dist/win-unpacked/` — binarios portables listos para ejecutar.

### Aviso importante

Esta herramienta **borra archivos de forma permanente**:

- La limpieza de **Descargas** elimina archivos personales, no solo basura. Revísala antes de ejecutarla o desactívala.
- Vaciar la **Papelera** y borrar **Prefetch** o **Logs** no se puede deshacer.
- Algunas operaciones requieren **permisos de administrador**; ejecuta la app solo desde una cuenta de confianza.
- Prueba primero en una máquina virtual o con una copia de seguridad si no estás seguro.

### Licencia

**GNU General Public License v3.0 (GPL-3.0)** — consulta [LICENSE](LICENSE). Puedes usarlo, modificarlo y redistribuirlo, incluso comercialmente, siempre que publiques las versiones modificadas bajo la misma licencia y conserves el crédito a **Alberto Ortiz**.

---

## English

### Table of contents

- [Overview](#overview)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Requirements](#requirements)
- [Running](#running)
- [Build and installer](#build-and-installer)
- [Important notice](#important-notice)
- [License](#license)

### Overview

**WinClean Analyzer** is a **Windows 10/11** desktop utility that combines disk cleaning, process monitoring and startup management in a dark glassmorphism interface. It is built with **Electron**, HTML, CSS and JavaScript, and uses **PowerShell** to query the system.

### Features

**Disk cleaner**

- **User temp** (`%TEMP%`) and **Windows temp** (`C:\Windows\Temp`).
- **Recycle Bin**.
- **Downloads folder**: analyses and removes accumulated files.
- **Prefetch** (`C:\Windows\Prefetch`) and **system logs** (`C:\Windows\Logs`).
- **Chrome and Edge cache**.
- **DNS flush**.

**Task manager**

- Real-time list of the processes consuming the most RAM (above 10 MB).
- Instant search to filter processes.
- Forced termination through `taskkill`.

**Startup manager**

- Lists apps registered to start with Windows and helps spot unnecessary ones.

**Recommendations panel**

- Summarises reclaimable space and suggests what to clean based on the detected junk volume.

### Tech stack

| Layer | Technology |
|---|---|
| Desktop shell | Electron 45 (Node.js 24 runtime) |
| Interface | HTML5, CSS3 (Grid, Flexbox, `backdrop-filter`, animations) and ES6+ JavaScript |
| System | Node APIs (`fs`, `child_process`, OS stats) and PowerShell scripts |
| Security | `preload.js` with `contextBridge` and context isolation |
| Installer | electron-builder and Inno Setup 7 |

### Project structure

```text
WinClean-Analyzer/
├── src/
│   ├── main/
│   │   ├── main.js          # Electron main process and IPC
│   │   └── preload.js       # Secure contextBridge
│   └── renderer/
│       ├── index.html       # Interface
│       ├── renderer.js      # UI logic
│       ├── styles.css       # OLED theme and glassmorphism
│       └── assets/icon.png
├── scripts/
│   ├── build-installer.js   # Inno Setup packaging
│   └── generate-icon.py     # Multi-resolution .ico icon
├── installer/winclean-analyzer.iss
├── build/                    # Generated icons
├── package.json
├── LICENSE
└── README.md
```

### Requirements

- **Windows 10/11 x64** (system analysis relies on Windows paths and commands).
- **Node.js 20 or later** for development; the final executable bundles its own runtime.
- **Inno Setup 7** only if you build the installer.
- Administrator rights to clean system folders and terminate some processes.

### Running

```bash
git clone https://github.com/alberto2005-coder/WinClean-Analyzer.git
cd WinClean-Analyzer
npm install
npm start
```

### Build and installer

```bash
npm run dist           # binaries + installer in dist/
npm run dist:portable  # portable build
npm run build:icon     # regenerate build/icon.ico from build/icon.png
```

Output in `dist/`:

- `dist/WinClean-Analyzer-Setup-v1.0.0.exe` — installer with LZMA2 compression, Spanish/English language selection, shortcuts and a clean uninstaller.
- `dist/win-unpacked/` — portable binaries ready to run.

### Important notice

This tool **deletes files permanently**:

- Cleaning **Downloads** removes personal files, not just junk. Review it before running or leave it disabled.
- Emptying the **Recycle Bin** and clearing **Prefetch** or **Logs** cannot be undone.
- Some operations require **administrator rights**; only run the app from a trusted account.
- Try it in a virtual machine or with a backup first if you are unsure.

### License

**GNU General Public License v3.0 (GPL-3.0)** — see [LICENSE](LICENSE). You may use, modify and redistribute it, including commercially, as long as modified versions are published under the same license and credit to **Alberto Ortiz** is preserved.

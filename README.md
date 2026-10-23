# 🧹 WinClean Analyzer

> **A premium, modern desktop storage cleaner and task manager for Windows built with Web Technologies (HTML, CSS, Node.js, and Electron).**

Desarrollado con pasión por **[Alberto Ortiz](https://github.com/alberto2005-coder)**.

---

## 🎨 Vista General y Filosofía de Diseño

**WinClean Analyzer** es una herramienta de optimización de sistema que rompe con la estética aburrida y tradicional de las herramientas del sistema. Combina un rendimiento de nivel nativo media[...]

* **Glassmorphism UI**: Paneles de control translúcidos con efectos de desenfoque de cristal (`backdrop-filter`).
* **OLED Cyberpunk Theme**: Paleta oscura profunda enriquecida con gradientes vibrantes y luces de neón en cyan, rosa y naranja.
* **Telemetría Nivel OS 60fps**: Medidores de rendimiento animados de CPU, RAM y almacenamiento en tiempo real a través de gráficos dinámicos SVG nativos.
* **Consola de Proceso Virtual**: Una terminal interactiva integrada estilo hacker que reporta el progreso preciso y detalla la liberación de megabytes.

---

## 🚀 Características Principales

### 1. Limpiador Avanzado de Disco (Purge System)
Analiza y purga de forma segura múltiples categorías de archivos temporales que ralentizan tu equipo:
* **Temporales de Usuario** (`%TEMP%`): Caché residual de aplicaciones instaladas.
* **Temporales de Windows** (`C:\Windows\Temp`): Archivos creados por procesos del sistema operativo.
* **Papelera de Reciclaje**: Vacía de forma completa los elementos en cola de eliminación.
* **Carpeta de Descargas** (`C:\Users\Usuario\Downloads`): Analiza y borra los archivos acumulados de descargas viejas.
* **Archivos Prefetch** (`C:\Windows\Prefetch`): Datos de precarga acumulados obsoletos.
* **Archivos de Registro (Logs)** (`C:\Windows\Logs`): Informes de eventos y volcados históricos del sistema.
* **Caché de Navegadores**: Descarga la caché web acumulada de **Google Chrome** y **Microsoft Edge**.
* **Limpieza de DNS**: Flush de la caché DNS para optimizar la resolución de red local.

### 2. Administrador de Tareas Inteligente
* Muestra en tiempo real los 30 procesos de Windows con mayor consumo de memoria RAM (>10MB).
* Barra de búsqueda reactiva para filtrar procesos en milisegundos.
* Terminación forzada a nivel de sistema (`taskkill`) para desbloquear programas colgados.

### 3. Gestor de Programas de Inicio
* Lista detallada de las aplicaciones configuradas en el registro para arrancar junto con Windows.
* Te ayuda a identificar programas innecesarios que ralentizan el encendido de la computadora.

### 4. Asistente de Recomendaciones
* Un panel interactivo que te saluda personalmente y te proporciona sugerencias personalizadas y alertas preventivas basadas en el volumen de basura que tienes acumulada en el disco.

---

## 🏗️ Requisitos e Instalación

Para ejecutar este proyecto en tu computadora necesitas tener instalado [Node.js](https://nodejs.org/).

### Pasos para iniciar en local:

1. **Clona el repositorio** en tu máquina:
   ```bash
   git clone https://github.com/tu-usuario/WinClean-Analyzer.git
   cd WinClean-Analyzer
   ```

2. **Instala las dependencias** de desarrollo (Electron):
   ```bash
   npm install
   ```

3. **Lanza la aplicación en modo desarrollo**:
   ```bash
   npm start
   ```

---

### 📦 Compilación y Generación del Release con Inno Setup 7:

WinClean Analyzer cuenta con empaquetado nativo y generación de instalador profesional de Windows (.exe) utilizando **Inno Setup 7**:

1. **Instala las dependencias**:
   ```bash
   npm install
   ```

2. **Compila la aplicación y genera el instalador**:
   ```bash
   npm run dist
   ```

3. **¡Listo!** En la carpeta `dist/` se creará:
   - `dist/WinClean-Analyzer-Setup-v1.0.0.exe`: Instalador ejecutable oficial compilado con Inno Setup 7 (compresión LZMA2, selección de idioma español/inglés, accesos directos y desinstalador limpio).
   - `dist/win-unpacked/`: Binarios portables descomprimidos listos para ejecución directa.

> [!TIP]
> **Icono Personalizado**: Para regenerar el icono `.ico` multi-resolución a partir de `build/icon.png`, ejecuta `npm run build:icon`.

---

## 🛠️ Stack Tecnológico

* **Frontend**: HTML5 Semántico, CSS3 Vanilla (Custom Properties, Flexbox, CSS Grid, Glassmorphism, Keyframe Animations), ES6+ JavaScript.
* **Core Desktop Engine**: [Electron.js](https://www.electronjs.org/) (v45.0.0 actualizado con Node.js v24.22.0 runtime) para empaquetado seguro y de máximo rendimiento.
* **Release & Installer**: [Inno Setup 7](https://jrsoftware.org/isinfo.php) para la creación de instaladores nativos de Windows de 64 bits.
* **Backend**: Node.js (File System APIs, Native OS Stats, `child_process` para intercomunicación).
* **Integración del OS**: Scripts optimizados en Windows **PowerShell** para telemetría exacta y administración de tareas.
* **Seguridad**: Arquitectura robusta basada en un archivo `preload.js` con aislamiento de contexto (`contextBridge`) para evitar inyecciones de código.

---

## 📝 Licencia

Este proyecto está bajo la **Licencia GPL-3.0**. Puedes usarlo, modificarlo y redistribuirlo libremente, incluso con fines comerciales, siempre que publicues el código fuente de tus versiones modificadas bajo la misma licencia (copyleft) y conserves el crédito a **[Alberto Ortiz](https://github.com/alberto2005-coder)**.

Consulta el archivo de [LICENSE](LICENSE) para los términos completos.


Desarrollado con 💻 y 🧹 por **Alberto Ortiz**.

---

# English Version

## Overview

**WinClean Analyzer** is a system optimization tool designed to break the visual boredom of traditional system utilities. It combines native-level performance with a premium interface and advanced cleaning features.

## Main Features

- Advanced disk cleaner for temporary files, browser cache, downloads, and logs
- Smart task manager with real-time process monitoring and forced termination
- Startup apps manager for Windows boot optimization
- Recommendations panel to guide cleanup actions

## Requirements

- [Node.js](https://nodejs.org/)
- Windows 10/11

## Run locally

```bash
git clone https://github.com/alberto2005-coder/WinClean-Analyzer.git
cd WinClean-Analyzer
npm install
npm start
```

## Build

```bash
npm install --save-dev electron-builder
npm run dist
```

This bilingual README keeps the original Spanish content first and adds the English overview below for broader accessibility.

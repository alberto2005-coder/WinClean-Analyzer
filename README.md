# 🧹 WinClean Analyzer

> **A premium, modern desktop storage cleaner and task manager for Windows built with Web Technologies (HTML, CSS, Node.js, and Electron).**

Desarrollado con pasión por **[Alberto Ortiz](https://github.com/alberto2005-coder)**.

---

## 🎨 Vista General y Filosofía de Diseño

**WinClean Analyzer** es una herramienta de optimización de sistema que rompe con la estética aburrida y tradicional de las herramientas del sistema. Combina un rendimiento de nivel nativo mediante scripts en segundo plano con una interfaz de usuario visualmente impresionante.

* **Glassmorphism UI**: Paneles de control traslúcidos con efectos de desenfoque de cristal (`backdrop-filter`).
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

### 📦 Compilación y Generación del Ejecutable (.EXE):

Al estar desarrollado con Electron, puedes empaquetar toda la aplicación en un **único archivo ejecutable (.exe) portátil** (sin necesidad de instalador) para llevar en un USB y usar en cualquier PC con Windows:

1. **Instala el empaquetador** `electron-builder` en tu entorno (una sola vez):
   ```bash
   npm install --save-dev electron-builder
   ```

2. **Compila la aplicación**:
   ```bash
   npm run dist
   ```

3. **¡Listo!** En la raíz de tu proyecto se creará una carpeta llamada `dist/` y dentro de ella tendrás el ejecutable **`WinClean Analyzer.exe`** compilado y listo para abrir en cualquier equipo.

> [!TIP]
> **Privilegios de Administrador**: Para realizar limpiezas exhaustivas en directorios protegidos del sistema como `Windows\Prefetch`, te recomendamos ejecutar la consola (o el archivo `.exe` generado) con **permisos de administrador**.

---

## 🛠️ Stack Tecnológico

* **Frontend**: HTML5 Semántico, CSS3 Vanilla (Custom Properties, Flexbox, CSS Grid, Glassmorphism, Keyframe Animations), ES6+ JavaScript.
* **Core Desktop Engine**: [Electron.js](https://www.electronjs.org/) (v30+) para el empaquetado nativo de escritorio.
* **Backend**: Node.js (File System APIs, Native OS Stats, `child_process` para intercomunicación).
* **Integración del OS**: Scripts optimizados en Windows **PowerShell** para telemetría exacta y administración de tareas.
* **Seguridad**: Arquitectura robusta basada en un archivo `preload.js` con aislamiento de contexto (`contextBridge`) para evitar inyecciones de código.

---

## 📝 Licencia y Uso Compartido (Forks)

Este proyecto es de uso gratuito y libre. Se permite clonarlo, utilizarlo y realizar bifurcaciones o adaptaciones ("forks") de forma totalmente gratuita bajo las siguientes condiciones obligatorias:

1. **Atribución Obligatoria**: Cualquier copia o fork debe mantener de forma prominente e inalterada el crédito y enlaces a **[Alberto Ortiz](https://github.com/alberto2005-coder)** tanto en el código fuente como en el badge de autoría de la interfaz visual.
2. **Claridad en Cambios**: Si realizas modificaciones en el código, debes declarar explícitamente en tu documentación (README) y en la pantalla que tu proyecto es un trabajo derivado basado en la obra original de Alberto Ortiz.
3. **Uso No Comercial**: Queda estrictamente prohibido vender, sublicenciar o lucrarse económicamente con este software o sus derivados sin la autorización previa por escrito del autor.

Para conocer todos los términos legales detallados, consulta el archivo de [LICENCIA](file:///c:/Users/alors/Downloads/WinClean-Analyzer/LICENSE).

Desarrollado con 💻 y 🧹 por **Alberto Ortiz**.

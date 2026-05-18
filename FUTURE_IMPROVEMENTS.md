# 🚀 WinClean Analyzer - Hoja de Ruta y Futuras Mejoras

Este documento detalla las ideas, optimizaciones avanzadas y características planificadas para expandir **WinClean Analyzer** de un limpiador de disco a una suite completa de optimización y mantenimiento de Windows de grado industrial.

> [!NOTE]
> Las tareas marcadas como ~~tachadas~~ ya han sido completamente implementadas y están operativas de forma nativa en la nueva pestaña de **Optimización** del programa.

---

## 📅 Roadmap de Módulos Planificados

### 1. ~~🕒 Programador de Limpieza Automatizada (Mantenimiento Silencioso) [COMPLETADO]~~
* ~~**Descripción**: Permitir al usuario programar limpiezas automáticas de temporales en segundo plano sin interrumpir su flujo de trabajo.~~
* ~~**Detalles Técnicos**:~~
  - ~~Intercepción CLI `--autoclean` en `main.js` para ejecutar limpiezas silenciosas en segundo plano.~~
  - ~~Registro y automatización de tareas en Windows Task Scheduler desde PowerShell (`Register-ScheduledTask`).~~
  - ~~Configuración en un clic desde la nueva pestaña visual "Optimización" con frecuencias Diario, Semanal y Mensual.~~

### 2. 🗃️ Limpiador Profundo de Registro de Windows (Registry Cleaner)
* **Descripción**: Analizar y purgar entradas de registro huérfanas, accesos directos rotos y restos de desinstalaciones pasadas.
* **Detalles Técnicos**:
  - Uso de comandos nativos de PowerShell o librerías de Node.js como `regedit` para interactuar con las colmenas `HKCU` y `HKLM` de forma segura.
  - Implementación de un backup automático antes de cada limpieza para permitir la restauración instantánea en caso de incidencias.

### 3. 📦 Desinstalador Inteligente Completo (Uninstaller Pro)
* **Descripción**: Un gestor visual que liste aplicaciones tradicionales (`.exe`) y aplicaciones modernas de la Microsoft Store (`UWP`).
* **Detalles Técnicos**:
  - Consulta mediante PowerShell (`Get-WmiObject Win32_Product` y `Get-AppxPackage`) para listar programas y su tamaño de ocupación real.
  - **Limpieza Residual de Desinstalación**: Escaneo automático post-desinstalación en `AppData\Local`, `AppData\Roaming`, `Program Files` y el Registro para eliminar carpetas huérfanas que los desinstaladores por defecto dejan atrás.

### 🔍 4. Detector de Archivos Duplicados y Basura Masiva
* **Descripción**: Escaneo de archivos duplicados pesados (imágenes, vídeos, instaladores) mediante comparación de firmas de archivos.
* **Detalles Técnicos**:
  - Algoritmo de hashing asíncrono (`crypto` de Node.js con `MD5`) procesando archivos en trozos sin bloquear la interfaz.
  - Selector visual intuitivo tipo carrusel para comparar previsualizaciones de fotos duplicadas antes de eliminarlas de forma masiva.

### 5. ~~🔒 Optimizador de Privacidad y Telemetría de Windows [COMPLETADO]~~
* ~~**Descripción**: Un panel de un solo clic para desactivar la recopilación de datos de Microsoft, anuncios personalizados y procesos espía en segundo plano.~~
* ~~**Detalles Técnicos**:~~
  - ~~Desactivación segura y persistente de servicios de telemetría de Windows (`DiagTrack` y `WerSvc`) desde PowerShell.~~
  - ~~Inyección y modificación de directivas en el registro de Windows para bloquear telemetría en segundo plano de Cortana (`AllowCortana`).~~
  - ~~Optimización del menú Inicio de Windows deshabilitando anuncios dinámicos e integración de búsquedas de Bing (`DisableSearchBoxSuggestions`).~~

---

## 🛠️ Optimizaciones Técnicas Futuras

* **Migración a TypeScript**: Reescribir el backend del proceso principal (`main.ts`) y del puente (`preload.ts`) para añadir tipado estricto y prevenir fallos en tiempo de ejecución.
* **Virtualización de Listas**: Implementar listas virtuales (como `react-window` o un buffer virtual nativo en JavaScript) en el Administrador de Tareas para soportar el renderizado fluido de más de 300 procesos en tiempo real con 0ms de retardo.
* **Integración de Iconos de Proceso**: Extraer dinámicamente los iconos oficiales `.exe` de los procesos de Windows en segundo plano (`Shell32` APIs de Windows) para mostrarlos junto al nombre del proceso en la tabla, dándole un look Premium absoluto.

---

Desarrollado con 💻 y visión de futuro por **Alberto Ortiz**.

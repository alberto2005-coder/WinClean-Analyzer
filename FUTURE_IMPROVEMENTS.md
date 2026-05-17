# 🚀 WinClean Analyzer - Hoja de Ruta y Futuras Mejoras

Este documento detalla las ideas, optimizaciones avanzadas y características planificadas para expandir **WinClean Analyzer** de un limpiador de disco a una suite completa de optimización y mantenimiento de Windows de grado industrial.

---

## 📅 Roadmap de Módulos Planificados

### 1. 🕒 Programador de Limpieza Automatizada (Mantenimiento Silencioso)
* **Descripción**: Permitir al usuario programar limpiezas automáticas de temporales en segundo plano sin interrumpir su flujo de trabajo.
* **Detalles Técnicos**:
  - Creación de un servicio en segundo plano de Node.js o una tarea programada oficial en Windows mediante PowerShell (`Register-ScheduledTask`).
  - Limpiezas automáticas semanales o cuando el almacenamiento disponible en el disco `C:` caiga por debajo del 10%.
  - Notificaciones nativas de Windows (`Notification` API de Electron) para avisar al usuario de los gigabytes liberados de forma silenciosa.

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

### 🔒 5. Optimizador de Privacidad y Telemetría de Windows
* **Descripción**: Un panel de un solo clic para desactivar la recopilación de datos de Microsoft, anuncios personalizados y procesos espía en segundo plano.
* **Detalles Técnicos**:
  - Desactivación segura de servicios de telemetría de Windows como el servicio `DiagTrack` (Experiencias del usuario y telemetría asociadas) mediante comandos `scconfig` y cambios en el Registro.
  - Desconexión de Cortana, informes de error automáticos y telemetría de navegadores para maximizar tanto la privacidad del usuario como la velocidad del procesador.

---

## 🛠️ Optimizaciones Técnicas Futuras

* **Migración a TypeScript**: Reescribir el backend del proceso principal (`main.ts`) y del puente (`preload.ts`) para añadir tipado estricto y prevenir fallos en tiempo de ejecución.
* **Virtualización de Listas**: Implementar listas virtuales (como `react-window` o un buffer virtual nativo en JavaScript) en el Administrador de Tareas para soportar el renderizado fluido de más de 300 procesos en tiempo real con 0ms de retardo.
* **Integración de Iconos de Proceso**: Extraer dinámicamente los iconos oficiales `.exe` de los procesos de Windows en segundo plano (`Shell32` APIs de Windows) para mostrarlos junto al nombre del proceso en la tabla, dándole un look Premium absoluto.

---

Desarrollado con 💻 y visión de futuro por **Alberto Ortiz**.

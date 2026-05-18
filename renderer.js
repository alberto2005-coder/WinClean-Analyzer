/* ==========================================
   WINCLEAN ANALYZER - INTERACTIVE FRONTEND CONTROLLER
   Developed by: Alberto Ortiz
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const tabs = document.querySelectorAll('.nav-link');
  const viewPanels = document.querySelectorAll('.tab-view');
  
  // Window buttons
  const btnMin = document.getElementById('win-btn-minimize');
  const btnMax = document.getElementById('win-btn-maximize');
  const btnClose = document.getElementById('win-btn-close');

  // Telemetry elements
  const cpuRing = document.getElementById('cpu-ring');
  const ramRing = document.getElementById('ram-ring');
  const diskRing = document.getElementById('disk-ring');
  const cpuVal = document.getElementById('cpu-val');
  const ramVal = document.getElementById('ram-val');
  const diskVal = document.getElementById('disk-val');
  const ramText = document.getElementById('ram-usage-text');
  const diskText = document.getElementById('disk-usage-text');
  const lastScanBadge = document.getElementById('last-scan-badge');
  const healthScoreBadge = document.getElementById('health-score-badge');

  // Cleaner elements
  const cleanerCheckboxes = document.querySelectorAll('.cleaner-checkbox');
  const btnSelectAll = document.getElementById('btn-select-all');
  const btnCleanScan = document.getElementById('btn-clean-scan');
  const btnCleanExecute = document.getElementById('btn-clean-execute');
  const btnDashboardScan = document.getElementById('btn-dashboard-scan');
  const terminalLog = document.getElementById('terminal-log');

  // Process Manager elements
  const processesTbody = document.getElementById('processes-tbody');
  const btnRefreshProcesses = document.getElementById('btn-refresh-processes');
  const inputProcessSearch = document.getElementById('input-process-search');

  // Startup elements
  const startupTbody = document.getElementById('startup-tbody');
  const btnRefreshStartup = document.getElementById('btn-refresh-startup');

  // Recommendations container
  const recommendationsBox = document.getElementById('recommendations-box');

  // State Variables
  let telemetryInterval = null;
  let processInterval = null;
  let scanResults = null;
  let isScanning = false;
  let isCleaning = false;

  // --- THEME SWITCHER LOGIC ---
  const btnTheme = document.getElementById('theme-toggle');
  const sunIcon = document.querySelector('.sun-icon');
  const moonIcon = document.querySelector('.moon-icon');

  // Load saved theme
  const savedTheme = localStorage.getItem('theme') || 'dark';
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    if (sunIcon) sunIcon.style.display = 'none';
    if (moonIcon) moonIcon.style.display = 'block';
  }

  if (btnTheme) {
    btnTheme.addEventListener('click', () => {
      const isLight = document.body.classList.toggle('light-theme');
      if (isLight) {
        localStorage.setItem('theme', 'light');
        if (sunIcon) sunIcon.style.display = 'none';
        if (moonIcon) moonIcon.style.display = 'block';
      } else {
        localStorage.setItem('theme', 'dark');
        if (sunIcon) sunIcon.style.display = 'block';
        if (moonIcon) moonIcon.style.display = 'none';
      }
    });
  }

  // --- WINDOW CONTROLS ---
  if (btnMin) {
    btnMin.addEventListener('click', async () => {
      try {
        await window.winCleanAPI.minimize();
      } catch (err) {
        console.error('Error minimizing:', err);
      }
    });
  }
  if (btnMax) {
    btnMax.addEventListener('click', async () => {
      try {
        await window.winCleanAPI.maximize();
      } catch (err) {
        console.error('Error maximizing:', err);
      }
    });
  }
  if (btnClose) {
    btnClose.addEventListener('click', async () => {
      try {
        await window.winCleanAPI.close();
      } catch (err) {
        console.error('Error closing:', err);
      }
    });
  }

  // --- TAB NAVIGATION ---
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      
      // Update sidebar state
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update content view state
      viewPanels.forEach(panel => {
        panel.classList.remove('active');
        if (panel.getAttribute('id') === targetTab) {
          panel.classList.add('active');
        }
      });

      // Tab lifecycle actions
      handleTabChange(targetTab);
    });
  });

  function handleTabChange(tabId) {
    // Clear background cycles
    if (processInterval) {
      clearInterval(processInterval);
      processInterval = null;
    }

    if (tabId === 'tab-dashboard') {
      startTelemetry();
    } else if (tabId === 'tab-cleaner') {
      // Auto scan on load if not done yet
      if (!scanResults && !isScanning) {
        triggerScan();
      }
    } else if (tabId === 'tab-processes') {
      fetchProcesses();
      // Keep process list updated every 4 seconds while looking at it
      processInterval = setInterval(fetchProcesses, 4000);
    } else if (tabId === 'tab-startup') {
      fetchStartupApps();
    } else if (tabId === 'tab-recommendations') {
      renderRecommendations();
    }
  }

  // --- TELEMETRY GAUGES ANIMATOR ---
  function updateRing(ringElement, valElement, percentage) {
    if (!ringElement || !valElement) return;
    const r = ringElement.r.baseVal.value;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (percentage / 100) * circumference;
    ringElement.style.strokeDashoffset = offset;
    valElement.innerText = `${percentage}%`;
  }

  async function updateTelemetry() {
    try {
      const stats = await window.winCleanAPI.getSystemStats();
      if (!stats) return;

      // Update UI rings
      updateRing(cpuRing, cpuVal, stats.cpu);
      updateRing(ramRing, ramVal, stats.ram.percent);
      updateRing(diskRing, diskVal, stats.disk.usedPercent);

      // Update subtexts
      if (ramText) {
        ramText.innerText = `Usado: ${stats.ram.used} GB / Total: ${stats.ram.total} GB`;
      }
      if (diskText) {
        diskText.innerText = `Libre: ${stats.disk.free} GB / Total: ${stats.disk.total} GB`;
      }
    } catch (e) {
      // Log silently
    }
  }

  function startTelemetry() {
    if (telemetryInterval) clearInterval(telemetryInterval);
    updateTelemetry();
    telemetryInterval = setInterval(updateTelemetry, 1500);
  }

  // --- SCANNING SYSTEM ---
  async function triggerScan() {
    if (isScanning || isCleaning) return;
    isScanning = true;
    btnCleanScan.disabled = true;
    if (btnDashboardScan) btnDashboardScan.disabled = true;
    
    // Set loading states in size badges
    cleanerCheckboxes.forEach(checkbox => {
      const category = checkbox.value;
      const badge = document.getElementById(`size-${category}`);
      if (badge) {
        badge.innerText = 'Escaneando...';
        badge.className = 'badge size-badge';
      }
    });

    writeTerminal('⚡ [ANÁLISIS] Iniciando escaneo de almacenamiento local...');
    writeTerminal('🔍 Analizando directorios temporales de usuario y sistema...');
    writeTerminal('🔍 Comprobando registros de eventos de Windows y caches de navegadores Chrome/Edge...');

    try {
      const results = await window.winCleanAPI.scanSystem();
      scanResults = results;
      
      let totalBytes = 0;
      
      // Update UI badges
      for (const [category, info] of Object.entries(results)) {
        totalBytes += info.sizeBytes;
        const badge = document.getElementById(`size-${category}`);
        if (badge) {
          badge.innerText = `${info.sizeMB} MB`;
          if (info.sizeBytes > 100 * 1024 * 1024) {
            badge.className = 'badge size-badge badge-orange'; // highlight heavy spots
          } else {
            badge.className = 'badge size-badge';
          }
        }
      }

      const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
      writeTerminal(`\n✅ [COMPLETO] Análisis finalizado con éxito.`);
      writeTerminal(`📦 Volumen total almacenable: ${totalMB} MB`);

      // Update Dashboard Hero Text dynamically!
      const heroTitle = document.querySelector('.hero-text-content h2');
      const heroDesc = document.querySelector('.hero-text-content p');
      if (heroTitle && heroDesc) {
        heroTitle.innerHTML = '¡Análisis del Sistema Completado!';
        heroDesc.innerHTML = `Se han detectado <strong>${totalMB} MB</strong> de datos temporales e innecesarios listos para ser eliminados de forma segura de tu disco.<br><br>Ve a la pestaña <strong>Limpiador</strong> para seleccionar qué deseas borrar y ejecutar la purga.`;
      }
      
      // Update Dashboard indicators
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      if (lastScanBadge) lastScanBadge.innerText = timeStr;
      
      let score = 'Excelente ✅';
      let scoreClass = 'text-cyan';
      if (totalBytes > 1024 * 1024 * 1024) {
        score = 'Urgente ⚠️';
        scoreClass = 'text-orange';
      } else if (totalBytes > 250 * 1024 * 1024) {
        score = 'Moderado ⚡';
        scoreClass = 'text-blue';
      }

      if (healthScoreBadge) {
        healthScoreBadge.innerText = score;
        healthScoreBadge.className = `val ${scoreClass}`;
      }

      btnCleanExecute.disabled = false;
      renderRecommendations();

    } catch (e) {
      writeTerminal(`\n❌ [ERROR] Falló el escaneo del sistema: ${e.message}`);
    } finally {
      isScanning = false;
      btnCleanScan.disabled = false;
      if (btnDashboardScan) btnDashboardScan.disabled = false;
    }
  }

  // --- CLEANING SYSTEM ---
  async function triggerClean() {
    if (isCleaning || isScanning) return;
    isCleaning = true;
    btnCleanExecute.disabled = true;
    btnCleanScan.disabled = true;

    // Get selected categories
    const selected = [];
    cleanerCheckboxes.forEach(checkbox => {
      if (checkbox.checked) selected.push(checkbox.value);
    });

    if (selected.length === 0) {
      writeTerminal('\n⚠️ [ALERTA] Por favor, selecciona al menos una categoría para limpiar.');
      isCleaning = false;
      btnCleanExecute.disabled = false;
      btnCleanScan.disabled = false;
      return;
    }

    writeTerminal('\n🧹 [PURGA] Iniciando limpieza de categorías seleccionadas...');
    writeTerminal('⏳ Ejecutando desinstalación de caché en segundo plano de Windows...');

    try {
      const report = await window.winCleanAPI.cleanSystem(selected);
      
      // Print detailed logs per cleaned category
      for (const [cat, info] of Object.entries(report.details)) {
        const catName = translateCategory(cat);
        writeTerminal(`🧹 [BORRADO] ${catName}: Eliminado ${info.sizeMB} MB (${info.files} archivos).`);
        if (info.locked > 0) {
          writeTerminal(`   ↳ Nota: ${info.locked} archivos omitidos (bloqueados en uso activo).`);
        }
      }

      writeTerminal(`\n🎉 [CONCLUIDO] ¡Optimización completada, Alberto!`);
      writeTerminal(`✨ Espacio total recuperado: ${report.freedMB} MB`);
      writeTerminal(`📁 Archivos eliminados con éxito: ${report.cleanedFiles}`);
      if (report.lockedFiles > 0) {
        writeTerminal(`🔒 Archivos bloqueados del sistema preservados de forma segura: ${report.lockedFiles}`);
      }

      // Automatically trigger an updated scan to refresh values
      await triggerScan();

    } catch (e) {
      writeTerminal(`\n❌ [ERROR] Ocurrió un fallo en el proceso de purgado: ${e.message}`);
      btnCleanExecute.disabled = false;
    } finally {
      isCleaning = false;
      btnCleanScan.disabled = false;
    }
  }

  // --- HELPER LOG WRITER FOR TERMINAL ---
  function writeTerminal(text) {
    if (!terminalLog) return;
    
    // If it's a fresh scan log list, empty console
    if (text.includes('⚡ [ANÁLISIS]')) {
      terminalLog.innerHTML = '';
    }

    const line = document.createElement('div');
    line.className = 'terminal-line';
    
    // Coloring text terms
    if (text.includes('[ERROR]') || text.includes('❌')) {
      line.style.color = '#ef4444'; // Red
    } else if (text.includes('[COMPLETO]') || text.includes('[CONCLUIDO]') || text.includes('✅') || text.includes('✨') || text.includes('🎉')) {
      line.style.color = '#10b981'; // Green
    } else if (text.includes('[ALERTA]') || text.includes('⚠️')) {
      line.style.color = '#eab308'; // Amber
    } else if (text.includes('[ANÁLISIS]') || text.includes('⚡')) {
      line.style.color = '#00f0ff'; // Cyan
    } else {
      line.style.color = '#a7f3d0'; // Soft code green
    }

    line.innerText = text;
    terminalLog.appendChild(line);
    
    // Auto-scroll terminal to bottom
    terminalLog.scrollTop = terminalLog.scrollHeight;
  }

  function translateCategory(key) {
    const mappings = {
      userTemp: 'Temporales de Usuario',
      systemTemp: 'Temporales del Sistema',
      prefetch: 'Archivos Prefetch',
      systemLogs: 'Archivos de Registro Logs',
      chromeCache: 'Caché Google Chrome',
      edgeCache: 'Caché Microsoft Edge',
      recycleBin: 'Papelera de Reciclaje',
      downloads: 'Carpeta de Descargas',
      dnsCache: 'Caché DNS de Red'
    };
    return mappings[key] || key;
  }

  // Bind Cleaner Buttons
  if (btnCleanScan) btnCleanScan.addEventListener('click', triggerScan);
  if (btnCleanExecute) btnCleanExecute.addEventListener('click', triggerClean);
  if (btnDashboardScan) btnDashboardScan.addEventListener('click', () => {
    // Switch to Cleaner tab first
    const cleanTabBtn = document.querySelector('[data-tab="tab-cleaner"]');
    if (cleanTabBtn) cleanTabBtn.click();
    // Wait a brief millisecond for animation and trigger scan
    setTimeout(triggerScan, 300);
  });

  // Select all checkboxes toggle
  if (btnSelectAll) {
    btnSelectAll.addEventListener('click', () => {
      // If some are unchecked, check all, otherwise uncheck all
      const allChecked = Array.from(cleanerCheckboxes).every(cb => cb.checked);
      cleanerCheckboxes.forEach(cb => {
        cb.checked = !allChecked;
      });
      btnSelectAll.innerText = allChecked ? 'Seleccionar Todos' : 'Deseleccionar Todos';
    });
  }

  // --- PROCESS MANAGER ---
  async function fetchProcesses() {
    try {
      const list = await window.winCleanAPI.getProcesses();
      if (!list) return;

      const searchTerm = inputProcessSearch.value.toLowerCase().trim();
      
      // Filter list based on search bar
      const filteredList = list.filter(p => p.name.toLowerCase().includes(searchTerm));

      processesTbody.innerHTML = '';
      
      if (filteredList.length === 0) {
        processesTbody.innerHTML = `
          <tr>
            <td colspan="5" class="text-center text-muted py-4">Ningún proceso activo coincide con "${searchTerm}"</td>
          </tr>
        `;
        return;
      }

      filteredList.forEach(p => {
        const row = document.createElement('tr');
        row.setAttribute('id', `proc-row-${p.pid}`);
        row.innerHTML = `
          <td style="font-weight:600; color:var(--text-main);">${p.name}</td>
          <td class="font-mono text-muted">${p.pid}</td>
          <td class="font-mono">${p.cpu} s</td>
          <td class="font-mono" style="color: var(--color-cyan); font-weight: 500;">${p.memory} MB</td>
          <td class="text-right">
            <button class="kill-btn" data-pid="${p.pid}" data-name="${p.name}">Finalizar Tarea</button>
          </td>
        `;
        processesTbody.appendChild(row);
      });

      // Bind Kill buttons
      const killBtns = processesTbody.querySelectorAll('.kill-btn');
      killBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
          const pid = btn.getAttribute('data-pid');
          const name = btn.getAttribute('data-name');
          
          btn.innerText = 'Cerrando...';
          btn.disabled = true;

          const success = await window.winCleanAPI.killProcess(pid);
          if (success) {
            // Remove row from table smoothly
            const row = document.getElementById(`proc-row-${pid}`);
            if (row) {
              row.style.opacity = '0.3';
              row.style.background = 'rgba(239, 68, 68, 0.05)';
            }
            writeTerminal(`🚫 [PROCESO] Finalizada tarea "${name}" (PID: ${pid}) a petición del usuario.`);
            // Quick reload
            setTimeout(fetchProcesses, 500);
          } else {
            btn.innerText = 'Error';
            btn.style.borderColor = 'red';
            setTimeout(() => {
              btn.innerText = 'Finalizar Tarea';
              btn.disabled = false;
            }, 2000);
          }
        });
      });

    } catch (e) {
      processesTbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-red py-4">Error al listar procesos de Windows.</td>
        </tr>
      `;
    }
  }

  // Refresh process list manually
  if (btnRefreshProcesses) {
    btnRefreshProcesses.addEventListener('click', () => {
      btnRefreshProcesses.disabled = true;
      fetchProcesses().finally(() => {
        setTimeout(() => { btnRefreshProcesses.disabled = false; }, 1000);
      });
    });
  }

  // Filter processes in real time on search typing
  if (inputProcessSearch) {
    inputProcessSearch.addEventListener('input', fetchProcesses);
  }

  // --- STARTUP APPS MONITOR ---
  async function fetchStartupApps() {
    try {
      startupTbody.innerHTML = `
        <tr>
          <td colspan="3" class="text-center py-4">Escaneando registro de Windows...</td>
        </tr>
      `;

      const list = await window.winCleanAPI.getStartupApps();
      startupTbody.innerHTML = '';

      if (!list || list.length === 0) {
        startupTbody.innerHTML = `
          <tr>
            <td colspan="3" class="text-center text-muted py-4">No se detectaron aplicaciones de inicio de terceros registradas.</td>
          </tr>
        `;
        return;
      }

      list.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td style="font-weight:600; color:var(--text-main);">${item.name}</td>
          <td style="color:var(--color-cyan); font-size:12px; font-weight:500;">${item.location}</td>
          <td><code class="path-code">${item.command}</code></td>
        `;
        startupTbody.appendChild(row);
      });

    } catch (e) {
      startupTbody.innerHTML = `
        <tr>
          <td colspan="3" class="text-center text-red py-4">Error al escanear aplicaciones de inicio.</td>
        </tr>
      `;
    }
  }

  if (btnRefreshStartup) {
    btnRefreshStartup.addEventListener('click', () => {
      btnRefreshStartup.disabled = true;
      fetchStartupApps().finally(() => {
        setTimeout(() => { btnRefreshStartup.disabled = false; }, 1000);
      });
    });
  }

  // --- GENERATING SMART SYSTEM RECOMMENDATIONS ---
  function renderRecommendations() {
    if (!recommendationsBox) return;
    recommendationsBox.innerHTML = '';

    const cards = [];

    // 1. General welcome / optimize card
    cards.push({
      type: 'info-card',
      title: '¡Hola, Alberto Ortiz!',
      desc: 'Este es tu centro de optimización personalizado. A continuación, verás un listado de tareas preventivas y alertas personalizadas basadas en el análisis actual de tu equipo.',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-cyan)" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`
    });

    if (scanResults) {
      let suggestionsCount = 0;

      // Chrome Cache Recommendation
      if (scanResults.chromeCache && scanResults.chromeCache.sizeBytes > 200 * 1024 * 1024) {
        suggestionsCount++;
        cards.push({
          type: 'warning-card',
          title: 'Liberar memoria caché de Google Chrome',
          desc: `Tu navegador Chrome está acumulando ${scanResults.chromeCache.sizeMB} MB en el disco duro. Aunque ayuda a cargar páginas más rápido, caches viejas o masivas pueden provocar cuelgues o retrasos en el renderizado de sitios modernos.`,
          icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange)" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a7 7 0 1 0 10 10"></path></svg>`
        });
      }

      // User Temp Recommendation
      if (scanResults.userTemp && scanResults.userTemp.sizeBytes > 300 * 1024 * 1024) {
        suggestionsCount++;
        cards.push({
          type: 'warning-card',
          title: 'Saturación en carpeta temporal del usuario',
          desc: `Se han encontrado ${scanResults.userTemp.sizeMB} MB de archivos residuales abandonados por instaladores y aplicaciones. Limpiar estos archivos es 100% seguro y liberará valiosos recursos de direccionamiento de tu almacenamiento principal.`,
          icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange)" stroke-width="2"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
        });
      }

      // Recycle Bin Recommendation
      if (scanResults.recycleBin && scanResults.recycleBin.sizeBytes > 500 * 1024 * 1024) {
        suggestionsCount++;
        cards.push({
          type: 'warning-card',
          title: 'Papelera de reciclaje cargada en exceso',
          desc: `Tienes ${scanResults.recycleBin.sizeMB} MB en la papelera de reciclaje de Windows. Los archivos borrados siguen ocupando espacio real en disco hasta que vacíes por completo la papelera. Se recomienda una purga definitiva.`,
          icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange)" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`
        });
      }

      // Perfect Health Score
      if (suggestionsCount === 0) {
        cards.push({
          type: 'success-card',
          title: '¡Tu almacenamiento está impecable!',
          desc: '¡Excelente trabajo de mantenimiento! El espacio en caché del sistema y temporales es extremadamente bajo. Tu computadora cuenta con un estado de limpieza excelente en estos momentos.',
          icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-emerald)" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
        });
      }

    } else {
      // If not scanned yet
      cards.push({
        type: 'info-card',
        title: 'Análisis pendiente de ejecución',
        desc: 'Para generar un diagnóstico de optimización inteligente en disco, ejecuta primero un análisis rápido del sistema pulsando en el botón circular de la sección de Dashboard o Limpiador.',
        icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
      });
    }

    // Pro-Tip static recommendation
    cards.push({
      type: 'info-card',
      title: 'Consejo Pro: Desactiva servicios de inicio residuales',
      desc: 'Muchas aplicaciones como launchers de videojuegos o programas de chat se auto-configuran para cargarse silenciosamente en segundo plano en Windows. Revisa de forma regular la pestaña de "Inicio Windows" y mantén activas únicamente las indispensables.',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-cyan)" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>`
    });

    // Render all cards
    cards.forEach(c => {
      const cardEl = document.createElement('div');
      cardEl.className = `card recom-card ${c.type}`;
      cardEl.innerHTML = `
        <div class="recom-icon">${c.icon}</div>
        <div class="recom-content">
          <h3>${c.title}</h3>
          <p>${c.desc}</p>
        </div>
      `;
      recommendationsBox.appendChild(cardEl);
    });
  }

  // --- OPTIMIZER FRONTEND CONTROL (ROADMAP TASK ACCOMPLISHED!) ---
  const chkTelemetry = document.getElementById('chk-telemetry');
  const chkCortanaReal = document.getElementById('chk-cortana');
  const chkSearchSuggestions = document.getElementById('chk-search-suggestions');
  const btnApplyPrivacy = document.getElementById('btn-apply-privacy');
  const privacyLog = document.getElementById('privacy-log');
  
  const selectSchedule = document.getElementById('select-schedule');
  const btnSaveSchedule = document.getElementById('btn-save-schedule');
  const scheduleIndicator = document.getElementById('schedule-indicator');
  const scheduleText = document.getElementById('schedule-text');

  async function loadPrivacyAndScheduleState() {
    try {
      const state = await window.winCleanAPI.getPrivacyState();
      if (chkTelemetry) chkTelemetry.checked = state.telemetry;
      if (chkCortanaReal) chkCortanaReal.checked = state.cortana;
      if (chkSearchSuggestions) chkSearchSuggestions.checked = state.search;
      
      if (selectSchedule) selectSchedule.value = state.schedule;
      
      updateScheduleBadge(state.schedule);
    } catch (err) {
      console.error('Error loading privacy state:', err);
    }
  }

  function updateScheduleBadge(scheduleType) {
    if (!scheduleIndicator || !scheduleText) return;
    if (scheduleType === 'off') {
      scheduleIndicator.style.background = 'var(--text-muted)';
      scheduleText.textContent = 'Desactivado';
      scheduleText.style.color = 'var(--text-sub)';
    } else {
      scheduleIndicator.style.background = 'var(--color-emerald)';
      let label = 'Activo';
      if (scheduleType === 'daily') label = 'Activo (Diario)';
      if (scheduleType === 'weekly') label = 'Activo (Semanal)';
      if (scheduleType === 'monthly') label = 'Activo (Mensual)';
      scheduleText.textContent = label;
      scheduleText.style.color = 'var(--color-emerald)';
    }
  }

  // Load state when tab is clicked
  const optTab = Array.from(tabs).find(t => t.getAttribute('data-tab') === 'tab-optimizer');
  if (optTab) {
    optTab.addEventListener('click', loadPrivacyAndScheduleState);
  }

  // Hook apply privacy button
  if (btnApplyPrivacy) {
    btnApplyPrivacy.addEventListener('click', async () => {
      btnApplyPrivacy.disabled = true;
      btnApplyPrivacy.textContent = 'Aplicando Cambios...';
      if (privacyLog) {
        privacyLog.style.display = 'block';
        privacyLog.textContent = '> Conectando con servicios de Windows...\n> Ejecutando scripts de optimización asíncronos...';
      }
      
      try {
        const toggles = {
          telemetry: chkTelemetry ? chkTelemetry.checked : false,
          cortana: chkCortanaReal ? chkCortanaReal.checked : false,
          search: chkSearchSuggestions ? chkSearchSuggestions.checked : false
        };
        
        const response = await window.winCleanAPI.applyPrivacyBoost(toggles);
        if (response.success) {
          if (privacyLog) {
            privacyLog.textContent = response.reports.map(r => `[ÉXITO] ${r}`).join('\n') + '\n> ¡Optimización aplicada correctamente!';
          }
        }
      } catch (err) {
        if (privacyLog) privacyLog.textContent = `[ERROR] No se pudieron aplicar los cambios:\n${err.message}`;
      } finally {
        btnApplyPrivacy.disabled = false;
        btnApplyPrivacy.textContent = 'Aplicar Cambios de Privacidad';
      }
    });
  }

  // Hook save schedule button
  if (btnSaveSchedule && selectSchedule) {
    btnSaveSchedule.addEventListener('click', async () => {
      btnSaveSchedule.disabled = true;
      const originalText = btnSaveSchedule.textContent;
      btnSaveSchedule.textContent = 'Guardando...';
      
      try {
        const scheduleVal = selectSchedule.value;
        const response = await window.winCleanAPI.saveSchedule(scheduleVal);
        if (response.success) {
          updateScheduleBadge(scheduleVal);
          alert(response.message);
        }
      } catch (err) {
        alert('Error al registrar la tarea programada: ' + err.message);
      } finally {
        btnSaveSchedule.disabled = false;
        btnSaveSchedule.textContent = originalText;
      }
    });
  }

  // Initial load
  setTimeout(loadPrivacyAndScheduleState, 1500);

  // --- INITIALIZE SYSTEM ---
  // Start dashboard active stats telemetry loop
  startTelemetry();

  // Auto-scan on load to show current status immediately
  setTimeout(triggerScan, 800);
});

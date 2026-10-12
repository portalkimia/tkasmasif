/**
 * ============================================================================
 * ANBK REALTIME TOKEN MONITOR & SHARE - CLIENT APPLICATION SCRIPT
 * ============================================================================
 */

(function () {
  'use strict';

  // --- DEFAULT DATASET (Matches Image 2 & Image 1 exactly) ---
  const DEFAULT_GROUPS = [
    {
      id: 1,
      name: 'Grup 1 (R1 & R2)',
      rooms: ['R1', 'R2'],
      roomsLabel: 'R1 & R2',
      proctorId: 'U05110068-AV3U',
      password: 'DK48M54G',
      token: 'CKDZEG',
      proctors: [
        { name: 'U. Puja', room: 'R1' },
        { name: 'U. Nikma', room: 'R2' }
      ],
      colorClass: 'group-1',
      testCode: 'GLDTKA26MAH4',
      testTime: '8/10/2026 06.50 - 15.00',
      lastUpdated: '07:15:00 WIB'
    },
    {
      id: 2,
      name: 'Grup 2 (R3 & R4)',
      rooms: ['R3', 'R4'],
      roomsLabel: 'R3 & R4',
      proctorId: 'U05110068-BV2U',
      password: 'LE54P60G',
      token: 'QLQLJS',
      proctors: [
        { name: 'U. Khofifah', room: 'R3' },
        { name: 'U. Tasya', room: 'R4' }
      ],
      colorClass: 'group-2',
      testCode: 'GLDTKA26MAH4',
      testTime: '8/10/2026 06.50 - 15.00',
      lastUpdated: '07:15:00 WIB'
    },
    {
      id: 3,
      name: 'Grup 3 (R5 & R6)',
      rooms: ['R5', 'R6'],
      roomsLabel: 'R5 & R6',
      proctorId: 'U05110068-CX7U',
      password: 'KV83C49G',
      token: 'KHAGOO',
      proctors: [
        { name: 'U. Ady', room: 'R5' },
        { name: 'U. Anita', room: 'R6' }
      ],
      colorClass: 'group-3',
      testCode: 'GLDTKA26MAH4',
      testTime: '8/10/2026 06.50 - 15.00',
      lastUpdated: '07:15:00 WIB'
    },
    {
      id: 4,
      name: 'Grup 4 (R7)',
      rooms: ['R7'],
      roomsLabel: 'R7 (Mandiri)',
      proctorId: 'U05110068-FZ4U',
      password: 'GQ89N21G',
      token: 'RBGRIK',
      proctors: [
        { name: 'U. Laila', room: 'R7' }
      ],
      colorClass: 'group-4',
      testCode: 'GLDTKA26MAH4',
      testTime: '8/10/2026 06.50 - 15.00',
      lastUpdated: '07:15:00 WIB'
    },
    {
      id: 5,
      name: 'Grup 5 (R8 & R9)',
      rooms: ['R8', 'R9'],
      roomsLabel: 'R8 & R9',
      proctorId: 'U05110068-DK7U',
      password: 'PB32N70G',
      token: 'JUBLQF',
      proctors: [
        { name: 'U. Tito', room: 'R8' },
        { name: 'U. Rafly', room: 'R9' }
      ],
      colorClass: 'group-5',
      testCode: 'GLDTKA26MAH4',
      testTime: '8/10/2026 06.50 - 15.00',
      lastUpdated: '07:15:00 WIB'
    },
    {
      id: 6,
      name: 'Grup 6 (R10 & R11)',
      rooms: ['R10', 'R11'],
      roomsLabel: 'R10 & R11',
      proctorId: 'U05110068-EK3U',
      password: 'YZ15U87G',
      token: 'NNLCFM',
      proctors: [
        { name: 'U. Yusuf', room: 'R10' },
        { name: 'U. Agus', room: 'R11' }
      ],
      colorClass: 'group-6',
      testCode: 'GLDTKA26MAH4',
      testTime: '8/10/2026 06.50 - 15.00',
      lastUpdated: '07:15:00 WIB'
    }
  ];

  // --- STATE ---
  let groupsData = [];
  let currentFilter = 'all';
  let currentSearch = '';
  let activeView = 'anbkView';
  let activeAnbkProctor = '5'; // default: U05110068-DK7U as shown in Image 1
  let countdownTimer = null;
  let pollIntervalTimer = null;
  let remainingSeconds = 5;
  let isFetching = false;
  let audioContext = null;

  // Default GAS Endpoint (Konfigurasi otomatis agar pengawas/guru tidak perlu input manual)
  const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbwUzzj_Gh17fBAZ29zJ8vVoprzZFBh6vm_8Y1TzI1wbzlWiYa6ygw-Z5XcQhzSjHi0rIA/exec';

  // Settings
  let settings = {
    gasUrl: DEFAULT_GAS_URL,
    refreshInterval: 5,
    soundEnabled: true
  };

  // --- INITIALIZATION ---
  document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadStoredTokens();
    renderAllViews();
    setupEventListeners();
    startSyncLoop();
    // Langsung lakukan sinkronisasi pertama kali ke Google Sheets
    fetchLatestTokens(false);
  });

  // --- SETTINGS STORAGE ---
  function loadSettings() {
    try {
      const stored = localStorage.getItem('anbk_token_settings');
      if (stored) {
        settings = Object.assign(settings, JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Gagal memuat pengaturan:', e);
    }

    // Pastikan selalu menggunakan URL default jika kosong atau belum terset
    if (!settings.gasUrl) {
      settings.gasUrl = DEFAULT_GAS_URL;
    }

    // Populate Settings Modal Inputs
    const gasInput = document.getElementById('gasUrlInput');
    const intervalSelect = document.getElementById('refreshIntervalSelect');
    const soundSelect = document.getElementById('soundNotificationSelect');
    const audioBtn = document.getElementById('btnAudioToggle');

    if (gasInput) gasInput.value = settings.gasUrl || DEFAULT_GAS_URL;
    if (intervalSelect) intervalSelect.value = String(settings.refreshInterval);
    if (soundSelect) soundSelect.value = String(settings.soundEnabled);
    if (audioBtn) {
      audioBtn.classList.toggle('active', settings.soundEnabled);
    }

    updateConnectionStatusPill();
  }

  function saveSettings() {
    const gasInput = document.getElementById('gasUrlInput');
    const intervalSelect = document.getElementById('refreshIntervalSelect');
    const soundSelect = document.getElementById('soundNotificationSelect');

    settings.gasUrl = (gasInput ? gasInput.value.trim() : '');
    settings.refreshInterval = parseInt(intervalSelect ? intervalSelect.value : '5', 10);
    settings.soundEnabled = (soundSelect ? soundSelect.value === 'true' : true);

    try {
      localStorage.setItem('anbk_token_settings', JSON.stringify(settings));
    } catch (e) {
      console.warn('Gagal menyimpan pengaturan:', e);
    }

    const audioBtn = document.getElementById('btnAudioToggle');
    if (audioBtn) audioBtn.classList.toggle('active', settings.soundEnabled);

    showToast('Pengaturan berhasil disimpan!', 'success');
    closeModal('settingsModal');

    // Restart timer with new interval
    startSyncLoop();
    fetchLatestTokens(true);
  }

  // --- TOKENS LOCAL DATA ---
  function loadStoredTokens() {
    try {
      const stored = localStorage.getItem('anbk_cached_tokens');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          groupsData = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('Gagal memuat cache token:', e);
    }
    // Default clone
    groupsData = JSON.parse(JSON.stringify(DEFAULT_GROUPS));
  }

  function saveCachedTokens() {
    try {
      localStorage.setItem('anbk_cached_tokens', JSON.stringify(groupsData));
    } catch (e) {
      console.warn('Gagal menyimpan cache token:', e);
    }
  }

  // --- AUDIO SYNTHESIS NOTIFICATION (Zero external files needed) ---
  function playTokenAlertSound() {
    if (!settings.soundEnabled) return;

    try {
      if (!audioContext) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioCtx();
      }

      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      const now = audioContext.currentTime;

      // Note 1: E5 (659.25 Hz)
      const osc1 = audioContext.createOscillator();
      const gain1 = audioContext.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(audioContext.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Note 2: A5 (880.00 Hz)
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0.18, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.55);

    } catch (err) {
      console.warn('Audio playback error:', err);
    }
  }

  // --- SYNC & POLLING ENGINE ---
  function startSyncLoop() {
    if (pollIntervalTimer) clearInterval(pollIntervalTimer);
    if (countdownTimer) clearInterval(countdownTimer);

    if (settings.refreshInterval <= 0) {
      document.getElementById('countdownSec').textContent = 'OFF';
      return;
    }

    remainingSeconds = settings.refreshInterval;
    updateCountdownUI();

    // 1-second countdown ticker
    countdownTimer = setInterval(() => {
      remainingSeconds--;
      if (remainingSeconds <= 0) {
        remainingSeconds = settings.refreshInterval;
        fetchLatestTokens(false);
      }
      updateCountdownUI();
    }, 1000);
  }

  function updateCountdownUI() {
    const secEl = document.getElementById('countdownSec');
    const circleEl = document.getElementById('countdownCircle');
    if (secEl) secEl.textContent = `${remainingSeconds}s`;

    if (circleEl && settings.refreshInterval > 0) {
      const percentage = (remainingSeconds / settings.refreshInterval) * 100;
      circleEl.setAttribute('stroke-dasharray', `${percentage}, 100`);
    }
  }

  async function fetchLatestTokens(isManual) {
    if (isFetching) return;
    isFetching = true;

    const refreshBtn = document.getElementById('btnManualRefresh');
    if (refreshBtn) refreshBtn.classList.add('loading');

    const updateClock = document.getElementById('lastUpdatedClock');
    const nowTimeStr = new Date().toLocaleTimeString('id-ID');

    // If no Google Apps Script URL is set yet, run simulation mode
    if (!settings.gasUrl) {
      setTimeout(() => {
        if (updateClock) updateClock.textContent = nowTimeStr;
        if (refreshBtn) refreshBtn.classList.remove('loading');
        isFetching = false;
        if (isManual) {
          showToast('Data diperbarui (Mode Offline / Demo)', 'info');
        }
      }, 400);
      return;
    }

    try {
      // Fetch from Google Apps Script Web App
      const fetchUrl = `${settings.gasUrl}${settings.gasUrl.includes('?') ? '&' : '?'}action=get&_t=${Date.now()}`;
      const response = await fetch(fetchUrl, {
        method: 'GET',
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const resJson = await response.json();

      if (resJson && resJson.status === 'success' && Array.isArray(resJson.data)) {
        handleIncomingData(resJson.data);
        updateConnectionStatusPill('online', 'LIVE SINKRON');
        if (updateClock) updateClock.textContent = nowTimeStr;
        if (isManual) showToast('Data token berhasil disinkronkan dari Google Sheets!', 'success');
      } else {
        throw new Error(resJson.message || 'Respon format tidak sesuai.');
      }
    } catch (err) {
      console.warn('Gagal sinkronisasi dengan Google Apps Script:', err);
      updateConnectionStatusPill('offline', 'OFFLINE / GAGAL');
      if (isManual) showToast(`Koneksi API Gagal: ${err.message}`, 'error');
    } finally {
      if (refreshBtn) refreshBtn.classList.remove('loading');
      isFetching = false;
    }
  }

  function handleIncomingData(incomingGroups) {
    let hasChanges = false;
    const changedGroupIds = [];

    incomingGroups.forEach(incoming => {
      const local = groupsData.find(g => g.id === incoming.groupId || g.id === incoming.id);
      if (local) {
        const incomingToken = (incoming.token || '').trim();
        if (incomingToken && incomingToken !== local.token) {
          hasChanges = true;
          changedGroupIds.push(local.id);
          local.token = incomingToken;
          local.lastUpdated = incoming.lastUpdated || new Date().toLocaleTimeString('id-ID') + ' WIB';
        }
      }
    });

    if (hasChanges) {
      saveCachedTokens();
      renderAllViews();
      playTokenAlertSound();

      // Highlight the updated cards
      changedGroupIds.forEach(gid => {
        const card = document.querySelector(`.token-card[data-group="${gid}"]`);
        if (card) {
          card.classList.add('updated-pulse');
          setTimeout(() => card.classList.remove('updated-pulse'), 1500);
        }
      });

      showToast(`Token Tes baru telah disinkronkan untuk ${changedGroupIds.length} ruang!`, 'success');
    }
  }

  function updateConnectionStatusPill(statusOverride, textOverride) {
    const pill = document.getElementById('btnOpenSettings') || document.getElementById('statusPill');
    const text = document.getElementById('statusText');
    if (!pill || !text) return;

    pill.className = 'server-status-pill clickable';

    if (statusOverride) {
      pill.classList.add(statusOverride);
      text.textContent = textOverride;
      return;
    }

    if (!settings.gasUrl) {
      pill.classList.add('offline');
      text.textContent = 'MODE DEMO';
    } else {
      pill.classList.add('online');
      text.textContent = 'LIVE SINKRON';
    }
  }

  // --- RENDER VIEWS ---
  function renderAllViews() {
    renderBoardView();
    renderAnbkTableView();
    renderSpreadsheetView();
  }

  // 1. BOARD VIEW (Monitor Kartu Token)
  function renderBoardView() {
    const grid = document.getElementById('tokenCardsGrid');
    if (!grid) return;

    const filtered = groupsData.filter(g => {
      // Filter by room chip
      if (currentFilter !== 'all' && String(g.id) !== String(currentFilter)) {
        return false;
      }
      // Filter by search
      if (currentSearch) {
        const q = currentSearch.toLowerCase();
        const matchRoom = g.rooms.some(r => r.toLowerCase().includes(q));
        const matchProctor = g.proctors.some(p => p.name.toLowerCase().includes(q));
        const matchId = g.proctorId.toLowerCase().includes(q);
        const matchToken = g.token.toLowerCase().includes(q);
        return matchRoom || matchProctor || matchId || matchToken;
      }
      return true;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 48px; background: #fff; border-radius: 12px; border: 1px dashed #cbd5e1;">
          <p style="font-size: 1rem; color: #64748b; font-weight: 600;">Tidak ada ruangan atau token yang cocok dengan pencarian "${currentSearch}".</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(group => {
      const isShared = group.rooms.length > 1;
      const roomsDisplay = group.rooms.join(' & ');

      const proctorListHtml = group.proctors.map(p => `
        <div class="proctor-item">
          <span class="proctor-name">${escapeHtml(p.name)}</span>
          <span class="room-tag">${escapeHtml(p.room)}</span>
        </div>
      `).join('');

      return `
        <div class="token-card" data-group="${group.id}">
          <div class="card-header-bar">
            <div class="card-rooms-title">
              <span class="rooms-badge">${escapeHtml(roomsDisplay)}</span>
              ${isShared ? '<span class="shared-pill">Token Bersama</span>' : '<span class="shared-pill">Mandiri</span>'}
            </div>
            <span class="badge-pair ${group.colorClass}">Grup ${group.id}</span>
          </div>

          <div class="card-body">
            <div class="card-proctor-info">
              <div class="proctor-names-list">
                ${proctorListHtml}
              </div>
              <div class="proctor-auth-row">
                <span class="auth-item">ID: <strong>${escapeHtml(group.proctorId)}</strong></span>
                <span class="auth-item">Pass: <strong>${escapeHtml(group.password)}</strong></span>
              </div>
            </div>

            <div class="token-showcase-box">
              <span class="token-label-micro">TOKEN TES AKTIF</span>
              <div class="token-value-display" id="tokenDisplay-${group.id}">${escapeHtml(group.token)}</div>
              
              <div class="token-actions-row">
                <button class="btn-copy-token" onclick="window.anbkApp.copyToken('${escapeJs(group.token)}', this)">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  <span>Salin Token</span>
                </button>
                <button class="btn-update-token" onclick="window.anbkApp.openUpdateModal(${group.id})">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  <span>Update</span>
                </button>
              </div>
            </div>

            <div class="card-footer-info">
              <span>● Status: <strong style="color: #10b981;">Aktif</strong></span>
              <span>Diperbarui: ${escapeHtml(group.lastUpdated || '--:--')}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // 2. ANBK OFFICIAL TABLE VIEW (Status Tes - Matches Image 1)
  function renderAnbkTableView() {
    const tbody = document.getElementById('anbkTableBody');
    if (!tbody) return;

    let displayRows = [];

    if (activeAnbkProctor === 'all') {
      displayRows = groupsData;
    } else {
      const selected = groupsData.find(g => String(g.id) === String(activeAnbkProctor));
      if (selected) {
        displayRows = [selected];
      } else {
        displayRows = groupsData;
      }
    }

    // Update active proctor badge in topbar to match selection
    if (activeAnbkProctor !== 'all') {
      const activeObj = groupsData.find(g => String(g.id) === String(activeAnbkProctor));
      if (activeObj) {
        const proctorIdEl = document.getElementById('activeProctorId');
        if (proctorIdEl) proctorIdEl.textContent = activeObj.proctorId;
      }
    }

    tbody.innerHTML = displayRows.map((g, index) => {
      // Row 1 (Sesi 1)
      const row1 = `
        <tr>
          <td>${index * 2 + 1}</td>
          <td><strong>${escapeHtml(g.testCode || 'GLDTKA26MAH4')}</strong></td>
          <td>8/10/2026 06.50 - 15.00</td>
          <td>-</td>
          <td>1</td>
          <td>
            <button class="btn-anbk-set btn-set-grey" onclick="window.anbkApp.openUpdateModal(${g.id})">Set</button>
          </td>
          <td>
            <span class="anbk-token-badge">${escapeHtml(g.token)}</span>
          </td>
          <td>
            ${g.rooms.map(r => `<span class="room-pill-tag">${r}</span>`).join('')}
          </td>
          <td>
            <button class="btn-copy-token" style="padding: 4px 10px; font-size: 0.75rem;" onclick="window.anbkApp.copyToken('${escapeJs(g.token)}', this)">
              Salin
            </button>
          </td>
        </tr>
      `;

      // Row 2 (Sesi 2 - matching screenshot with Rilis Token button)
      const row2 = `
        <tr>
          <td>${index * 2 + 2}</td>
          <td><strong>${escapeHtml(g.testCode || 'GLDTKA26MAH4')}</strong></td>
          <td>8/10/2026 09.25 - 15.00</td>
          <td>-</td>
          <td>2</td>
          <td>
            <button class="btn-anbk-set" onclick="window.anbkApp.openUpdateModal(${g.id})">Set</button>
          </td>
          <td>
            <button class="btn-anbk-rilis" onclick="window.anbkApp.openUpdateModal(${g.id})">Rilis Token</button>
          </td>
          <td>
            ${g.rooms.map(r => `<span class="room-pill-tag">${r}</span>`).join('')}
          </td>
          <td>
            <button class="btn-update-token" style="padding: 4px 10px; font-size: 0.75rem;" onclick="window.anbkApp.openUpdateModal(${g.id})">
              Update
            </button>
          </td>
        </tr>
      `;

      return row1 + row2;
    }).join('');
  }

  // 3. SPREADSHEET TABLE VIEW (Exact replica of Image 2)
  function renderSpreadsheetView() {
    const tbody = document.getElementById('spreadsheetBody');
    if (!tbody) return;

    let html = '';

    groupsData.forEach(g => {
      const isMultiProctor = g.proctors.length > 1;
      const numRows = g.proctors.length;

      g.proctors.forEach((proctor, idx) => {
        const isFirst = (idx === 0);
        const bgClass = `group-bg-${g.id}`;

        html += `<tr class="${bgClass}">`;

        // Col 1: Nama Pengawas
        html += `<td style="font-weight: 600;">${escapeHtml(proctor.name)}</td>`;

        // Col 2: PROKTOR ID (merged if multi-proctor)
        if (isFirst) {
          html += `<td rowspan="${numRows}" class="sheet-center-cell" style="font-weight: 600;">${escapeHtml(g.proctorId)}</td>`;
          html += `<td rowspan="${numRows}" class="sheet-center-cell">${escapeHtml(g.password)}</td>`;
        }

        // Col 4: RUANG
        html += `<td class="sheet-room-cell">${escapeHtml(proctor.room)}</td>`;

        // Col 5: TOKEN (merged if multi-proctor)
        if (isFirst) {
          html += `<td rowspan="${numRows}" class="sheet-token-cell">${escapeHtml(g.token)}</td>`;
          html += `
            <td rowspan="${numRows}" style="text-align: center;">
              <button class="btn-update-token" style="padding: 4px 8px; font-size: 0.75rem;" onclick="window.anbkApp.openUpdateModal(${g.id})">
                Ganti Token
              </button>
            </td>
          `;
        }

        html += `</tr>`;
      });
    });

    tbody.innerHTML = html;
  }

  // --- ACTIONS: UPDATE TOKEN ---
  function openUpdateModal(groupId) {
    const group = groupsData.find(g => g.id === groupId);
    if (!group) return;

    const modalTitle = document.getElementById('modalGroupTitle');
    const modalSubtitle = document.getElementById('modalGroupSubtitle');
    const hiddenId = document.getElementById('modalGroupId');
    const tokenInput = document.getElementById('newTokenInput');

    if (modalTitle) modalTitle.textContent = `Rilis / Update Token ${group.roomsLabel}`;
    if (modalSubtitle) modalSubtitle.textContent = `Proktor ID: ${group.proctorId} | Pengawas: ${group.proctors.map(p => p.name).join(', ')}`;
    if (hiddenId) hiddenId.value = String(group.id);
    if (tokenInput) {
      tokenInput.value = group.token;
      tokenInput.focus();
      tokenInput.select();
    }

    openModal('updateTokenModal');
  }

  async function handleTokenFormSubmit(e) {
    e.preventDefault();

    const hiddenId = document.getElementById('modalGroupId');
    const tokenInput = document.getElementById('newTokenInput');
    const updaterInput = document.getElementById('updaterNameInput');
    const submitBtn = document.getElementById('submitUpdateBtn');
    const submitSpinner = document.getElementById('submitSpinner');
    const submitText = document.getElementById('btnSubmitText');

    const groupId = parseInt(hiddenId.value, 10);
    const newToken = tokenInput.value.trim().toUpperCase();
    const updaterName = (updaterInput.value.trim() || 'Proktor Web');

    if (!newToken || newToken.length < 3) {
      showToast('Token minimal 3 karakter huruf.', 'error');
      return;
    }

    // Loading state
    if (submitSpinner) submitSpinner.style.display = 'inline-block';
    if (submitText) submitText.textContent = 'Menyimpan...';
    if (submitBtn) submitBtn.disabled = true;

    // Optimistic local update
    const group = groupsData.find(g => g.id === groupId);
    if (group) {
      group.token = newToken;
      group.lastUpdated = new Date().toLocaleTimeString('id-ID') + ' WIB';
      saveCachedTokens();
      renderAllViews();
      playTokenAlertSound();
    }

    // Push to Google Apps Script if URL configured
    if (settings.gasUrl) {
      try {
        const updateUrl = `${settings.gasUrl}${settings.gasUrl.includes('?') ? '&' : '?'}action=update&groupId=${groupId}&token=${encodeURIComponent(newToken)}&updatedBy=${encodeURIComponent(updaterName)}&_t=${Date.now()}`;
        
        const response = await fetch(updateUrl, {
          method: 'GET', // Using GET fallback for reliable CORS compatibility in all environments
          cache: 'no-store'
        });

        const resJson = await response.json();
        if (resJson && resJson.status === 'success') {
          showToast(`Token untuk ${group ? group.roomsLabel : ''} berhasil diperbarui di Google Sheets!`, 'success');
        } else {
          showToast(`Token disimpan lokal, namun respon Google Sheets: ${resJson.message || 'Gagal'}`, 'info');
        }
      } catch (err) {
        console.warn('Gagal push ke GAS:', err);
        showToast('Token disimpan secara lokal (Gagal menghubungi API Google Sheets)', 'info');
      }
    } else {
      showToast(`Token untuk ${group ? group.roomsLabel : ''} berhasil diupdate secara lokal!`, 'success');
    }

    // Reset button
    if (submitSpinner) submitSpinner.style.display = 'none';
    if (submitText) submitText.textContent = 'Simpan & Bagikan Token';
    if (submitBtn) submitBtn.disabled = false;

    closeModal('updateTokenModal');
  }

  function generateRandomToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const tokenInput = document.getElementById('newTokenInput');
    if (tokenInput) {
      tokenInput.value = result;
      tokenInput.focus();
    }
  }

  // --- COPY TOKEN CLIPBOARD ---
  async function copyToken(tokenText, btnElement) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(tokenText);
      } else {
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = tokenText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      if (btnElement) {
        const origHtml = btnElement.innerHTML;
        btnElement.classList.add('copied');
        btnElement.innerHTML = `
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          <span>Tersalin!</span>
        `;
        setTimeout(() => {
          btnElement.classList.remove('copied');
          btnElement.innerHTML = origHtml;
        }, 1500);
      }

      showToast(`Token "${tokenText}" berhasil disalin ke clipboard!`, 'info');
    } catch (err) {
      showToast('Gagal menyalin token ke clipboard.', 'error');
    }
  }

  // --- TEST CONNECTION ---
  async function testGasConnection() {
    const gasInput = document.getElementById('gasUrlInput');
    const resultBox = document.getElementById('connectionTestResult');
    const testBtn = document.getElementById('btnTestConnection');

    const testUrl = (gasInput ? gasInput.value.trim() : '');

    if (!testUrl) {
      if (resultBox) {
        resultBox.style.display = 'block';
        resultBox.className = 'connection-test-banner error';
        resultBox.textContent = 'Silakan masukkan URL Web App Google Apps Script terlebih dahulu.';
      }
      return;
    }

    if (testBtn) {
      testBtn.textContent = 'Menguji...';
      testBtn.disabled = true;
    }

    try {
      const endpoint = `${testUrl}${testUrl.includes('?') ? '&' : '?'}action=get&_t=${Date.now()}`;
      const response = await fetch(endpoint, { cache: 'no-store' });
      const data = await response.json();

      if (data && data.status === 'success') {
        resultBox.style.display = 'block';
        resultBox.className = 'connection-test-banner success';
        resultBox.textContent = `✓ Berhasil terhubung! Terdeteksi ${data.data ? data.data.length : 0} grup ruangan dari Google Sheets.`;
      } else {
        throw new Error(data.message || 'Respon status gagal.');
      }
    } catch (err) {
      resultBox.style.display = 'block';
      resultBox.className = 'connection-test-banner error';
      resultBox.textContent = `✕ Gagal terhubung ke API: ${err.message}. Pastikan akses di Apps Script diatur ke 'Anyone'.`;
    } finally {
      if (testBtn) {
        testBtn.textContent = 'Uji Koneksi API';
        testBtn.disabled = false;
      }
    }
  }

  function resetToDemoData() {
    groupsData = JSON.parse(JSON.stringify(DEFAULT_GROUPS));
    saveCachedTokens();
    renderAllViews();
    showToast('Data berhasil direset kembali ke susunan awal screenshot.', 'info');
  }

  // --- MODAL UTILS ---
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('show');
      modal.setAttribute('aria-hidden', 'false');
    }
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  // --- TOAST UTILS ---
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
    } else {
      iconSvg = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#0091ea" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    }

    toast.innerHTML = `
      ${iconSvg}
      <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    // Sidebar Collapse Toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
      });
    }

    // Mobile Sidebar Toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn && sidebar) {
      mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
      });
    }

    // Manual Refresh
    const refreshBtn = document.getElementById('btnManualRefresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        fetchLatestTokens(true);
      });
    }

    // Audio Bell Toggle
    const audioBtn = document.getElementById('btnAudioToggle');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        settings.soundEnabled = !settings.soundEnabled;
        audioBtn.classList.toggle('active', settings.soundEnabled);
        localStorage.setItem('anbk_token_settings', JSON.stringify(settings));
        showToast(`Notifikasi suara: ${settings.soundEnabled ? 'Aktif' : 'Nonaktif'}`, 'info');
        if (settings.soundEnabled) playTokenAlertSound();
      });
    }

    // View Mode Switcher
    const viewButtons = document.querySelectorAll('.view-tab-btn');
    viewButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        viewButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const targetView = btn.getAttribute('data-view');
        activeView = targetView;

        document.querySelectorAll('.view-panel').forEach(panel => {
          panel.classList.remove('active');
        });

        const activePanel = document.getElementById(targetView);
        if (activePanel) activePanel.classList.add('active');

        const labelMap = {
          anbkView: 'List Status Tes',
          boardView: 'Monitor Kartu Token',
          sheetView: 'Format Spreadsheet'
        };
        const viewLabel = document.getElementById('currentViewLabel');
        if (viewLabel) viewLabel.textContent = labelMap[targetView] || '';
      });
    });

    // Room Filter Chips
    const filterChips = document.querySelectorAll('.chip-btn');
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentFilter = chip.getAttribute('data-filter');
        renderBoardView();
      });
    });

    // Search Input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value.trim();
        renderBoardView();
      });
    }

    // Proctor Selector in ANBK View
    const proctorSelector = document.getElementById('proctorSelector');
    if (proctorSelector) {
      proctorSelector.addEventListener('change', (e) => {
        activeAnbkProctor = e.target.value;
        renderAnbkTableView();
      });
    }

    // Modals Close on backdrop or X
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal(modal.id);
        }
      });
    });

    const closeUpdateBtn = document.getElementById('closeUpdateModalBtn');
    const cancelUpdateBtn = document.getElementById('cancelUpdateBtn');
    if (closeUpdateBtn) closeUpdateBtn.addEventListener('click', () => closeModal('updateTokenModal'));
    if (cancelUpdateBtn) cancelUpdateBtn.addEventListener('click', () => closeModal('updateTokenModal'));

    const closeSettingsBtn = document.getElementById('closeSettingsModalBtn');
    if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => closeModal('settingsModal'));

    const btnOpenSettings = document.getElementById('btnOpenSettings');
    if (btnOpenSettings) btnOpenSettings.addEventListener('click', () => openModal('settingsModal'));

    const timerCountdown = document.getElementById('timerCountdown');
    if (timerCountdown) timerCountdown.addEventListener('click', () => openModal('settingsModal'));

    // Token Form Submit
    const tokenForm = document.getElementById('tokenUpdateForm');
    if (tokenForm) tokenForm.addEventListener('submit', handleTokenFormSubmit);

    // Random Token Generator Button
    const btnGenToken = document.getElementById('btnGenerateRandomToken');
    if (btnGenToken) btnGenToken.addEventListener('click', generateRandomToken);

    // Settings Form Submit
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
      settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveSettings();
      });
    }

    // Test Connection Button
    const btnTestConn = document.getElementById('btnTestConnection');
    if (btnTestConn) btnTestConn.addEventListener('click', testGasConnection);

    // Reset Demo Button
    const btnResetDemo = document.getElementById('btnResetToDemo');
    if (btnResetDemo) btnResetDemo.addEventListener('click', resetToDemoData);
  }

  // --- HELPER ESCAPES ---
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeJs(str) {
    if (!str) return '';
    return String(str).replace(/'/g, "\\'").replace(/"/g, '\\"');
  }

  // Expose to window for inline onclicks
  window.anbkApp = {
    openUpdateModal,
    copyToken
  };

})();

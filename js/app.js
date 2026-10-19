/**
 * ============================================================================
 * ANBK REALTIME TOKEN MONITOR & SHARE - CLIENT APPLICATION SCRIPT
 * ============================================================================
 * Fitur:
 * 1. Tampilan Proktor Bayangan Sama Persis dengan Proktor Utama (Tampilan Resmi ANBK)
 * 2. Tombol Penghubung Khusus Proktor Bayangan (Minta Token Baru & Reset Peserta)
 * 3. Form Reset Login Cukup Nama Saja yang Wajib (Nomor Ujian Opsional)
 * 4. Polling Super Cepat (1.5 Detik via CacheService) untuk Notifikasi Instan
 * 5. Push Notifikasi Desktop Native Peramban (Hanya Visual, Tanpa Bunyi Alarm)
 * 6. Kompatibel Penuh dengan Backend Google Apps Script (GAS) & GitHub Pages
 * ============================================================================
 */

(function () {
  'use strict';

  // --- ROOMS CONFIGURATION (11 Ruangan Ujian ANBK) ---
  const ROOMS_CONFIG = [
    {
      room: 'R1',
      role: 'utama',
      roleLabel: 'Proktor Utama',
      name: 'U. Puja',
      partnerRoom: 'R2',
      partnerName: 'U. Nikma',
      groupId: 1,
      groupLabel: 'Grup 1',
      proctorId: 'U05110068-AV3U',
      password: 'DK48M54G',
      colorClass: 'group-1'
    },
    {
      room: 'R2',
      role: 'bayangan',
      roleLabel: 'Proktor Bayangan',
      name: 'U. Nikma',
      partnerRoom: 'R1',
      partnerName: 'U. Puja',
      groupId: 1,
      groupLabel: 'Grup 1',
      proctorId: 'U05110068-AV3U',
      password: 'DK48M54G',
      colorClass: 'group-1'
    },
    {
      room: 'R3',
      role: 'utama',
      roleLabel: 'Proktor Utama',
      name: 'U. Khofifah',
      partnerRoom: 'R4',
      partnerName: 'U. Tasya',
      groupId: 2,
      groupLabel: 'Grup 2',
      proctorId: 'U05110068-BV2U',
      password: 'LE54P60G',
      colorClass: 'group-2'
    },
    {
      room: 'R4',
      role: 'bayangan',
      roleLabel: 'Proktor Bayangan',
      name: 'U. Tasya',
      partnerRoom: 'R3',
      partnerName: 'U. Khofifah',
      groupId: 2,
      groupLabel: 'Grup 2',
      proctorId: 'U05110068-BV2U',
      password: 'LE54P60G',
      colorClass: 'group-2'
    },
    {
      room: 'R5',
      role: 'utama',
      roleLabel: 'Proktor Utama',
      name: 'U. Ady',
      partnerRoom: 'R6',
      partnerName: 'U. Anita',
      groupId: 3,
      groupLabel: 'Grup 3',
      proctorId: 'U05110068-CX7U',
      password: 'KV83C49G',
      colorClass: 'group-3'
    },
    {
      room: 'R6',
      role: 'bayangan',
      roleLabel: 'Proktor Bayangan',
      name: 'U. Anita',
      partnerRoom: 'R5',
      partnerName: 'U. Ady',
      groupId: 3,
      groupLabel: 'Grup 3',
      proctorId: 'U05110068-CX7U',
      password: 'KV83C49G',
      colorClass: 'group-3'
    },
    {
      room: 'R7',
      role: 'utama',
      roleLabel: 'Proktor Utama Mandiri',
      name: 'U. Laila',
      partnerRoom: null,
      partnerName: null,
      groupId: 4,
      groupLabel: 'Grup 4',
      proctorId: 'U05110068-FZ4U',
      password: 'GQ89N21G',
      colorClass: 'group-4'
    },
    {
      room: 'R8',
      role: 'utama',
      roleLabel: 'Proktor Utama',
      name: 'U. Tito',
      partnerRoom: 'R9',
      partnerName: 'U. Rafly',
      groupId: 5,
      groupLabel: 'Grup 5',
      proctorId: 'U05110068-DK7U',
      password: 'PB32N70G',
      colorClass: 'group-5'
    },
    {
      room: 'R9',
      role: 'bayangan',
      roleLabel: 'Proktor Bayangan',
      name: 'U. Rafly',
      partnerRoom: 'R8',
      partnerName: 'U. Tito',
      groupId: 5,
      groupLabel: 'Grup 5',
      proctorId: 'U05110068-DK7U',
      password: 'PB32N70G',
      colorClass: 'group-5'
    },
    {
      room: 'R10',
      role: 'utama',
      roleLabel: 'Proktor Utama',
      name: 'U. Yusuf',
      partnerRoom: 'R11',
      partnerName: 'U. Agus',
      groupId: 6,
      groupLabel: 'Grup 6',
      proctorId: 'U05110068-EK3U',
      password: 'YZ15U87G',
      colorClass: 'group-6'
    },
    {
      room: 'R11',
      role: 'bayangan',
      roleLabel: 'Proktor Bayangan',
      name: 'U. Agus',
      partnerRoom: 'R10',
      partnerName: 'U. Yusuf',
      groupId: 6,
      groupLabel: 'Grup 6',
      proctorId: 'U05110068-EK3U',
      password: 'YZ15U87G',
      colorClass: 'group-6'
    }
  ];

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

  // Default GAS Endpoint
  const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbwUzzj_Gh17fBAZ29zJ8vVoprzZFBh6vm_8Y1TzI1wbzlWiYa6ygw-Z5XcQhzSjHi0rIA/exec';

  // --- STATE ---
  let groupsData = [];
  let currentRoomCode = null; // 'R1', 'R2', ...
  let currentRoomObj = null;  // Room config object
  let currentFilter = 'all';
  let currentSearch = '';
  let activeView = 'anbkView';
  let activeAnbkProctor = '1';
  let countdownTimer = null;
  let fastPollTimer = null; // High-speed request polling (1.5 detik)
  let remainingSeconds = 5;
  let isFetching = false;
  let tokenDataVersion = 0;
  let isSendingTokenRequest = false;
  let isConfirmingReset = false;
  let audioContext = null;
  const STORAGE_ALERTED_KEY = 'anbk_alerted_requests';
  function loadAlertedRequestIds() {
    try {
      const raw = sessionStorage.getItem(STORAGE_ALERTED_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return new Set(arr);
      }
    } catch (e) {}
    return new Set();
  }

  function saveAlertedRequestIds() {
    try {
      sessionStorage.setItem(STORAGE_ALERTED_KEY, JSON.stringify(Array.from(alertedRequestIds)));
    } catch (e) {}
  }

  let alertedRequestIds = loadAlertedRequestIds(); // Prevent duplicate alerts
  let requestHistory = []; // Local request log
  let lastResetConfirmId = (function() {
    try {
      return sessionStorage.getItem('anbk_last_reset_confirm_id') || null;
    } catch (e) {
      return null;
    }
  })(); // Melacak ID sinyal konfirmasi reset terbaru

  // Settings
  let settings = {
    gasUrl: DEFAULT_GAS_URL,
    refreshInterval: 5,
    desktopNotificationsEnabled: true,
    soundEnabled: true
  };

  // --- INITIALIZATION ---
  document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadStoredTokens();
    loadStoredRequestHistory();
    renderAllViews();
    setupEventListeners();
    initRoomGate();
    startSyncLoop();
    fetchLatestTokens(false);
  });

  // --- ROOM SELECTION GATE LOGIC ---
  function initRoomGate() {
    renderGateRooms();
    const savedRoom = localStorage.getItem('anbk_selected_room');
    if (savedRoom && ROOMS_CONFIG.some(r => r.room === savedRoom)) {
      selectRoom(savedRoom, false);
    } else {
      openModal('roomSelectGate');
    }
  }

  function renderGateRooms() {
    const grid = document.getElementById('gateRoomsGrid');
    if (!grid) return;

    grid.innerHTML = ROOMS_CONFIG.map(r => {
      const isUtama = r.role === 'utama';
      const roleBadgeClass = isUtama ? 'role-utama' : 'role-bayangan';
      const roleText = isUtama ? (r.room === 'R7' ? 'Proktor Utama (Mandiri)' : 'Proktor Utama') : 'Proktor Bayangan';
      const partnerText = r.partnerRoom 
        ? `Pasangan: <strong>${r.partnerRoom} (${r.partnerName})</strong>`
        : `Ruangan Mandiri (Tanpa Bayangan)`;

      const isCurrentSelected = currentRoomCode === r.room ? 'selected' : '';

      // Ambil password dari grup jika sudah termuat
      const grp = groupsData.find(g => g.id === r.groupId);
      const pass = (grp && grp.password) ? grp.password : r.password;

      return `
        <div class="gate-room-card ${isCurrentSelected}" data-room="${r.room}">
          <div class="gate-card-top">
            <span class="gate-room-badge">${r.room}</span>
            <span class="gate-role-pill ${roleBadgeClass}">${roleText}</span>
          </div>
          <div class="gate-proctor-name">${escapeHtml(r.name)}</div>
          <div class="gate-partner-info">${partnerText}</div>
          <div class="gate-auth-box">
            <div class="gate-auth-item">
              <span class="gate-auth-label">Proktor ID:</span>
              <strong class="gate-auth-val">${escapeHtml(r.proctorId)}</strong>
            </div>
            <div class="gate-auth-item">
              <span class="gate-auth-label">Password:</span>
              <strong class="gate-auth-val gate-auth-pass">${escapeHtml(pass)}</strong>
            </div>
          </div>
          <div class="gate-card-bottom">
            <span class="gate-group-tag ${r.colorClass}">${escapeHtml(r.groupLabel)}</span>
          </div>
        </div>
      `;
    }).join('');

    // Attach click events
    grid.querySelectorAll('.gate-room-card').forEach(card => {
      card.addEventListener('click', () => {
        const roomCode = card.getAttribute('data-room');
        if (roomCode) {
          selectRoom(roomCode, true);
        }
      });
    });
  }

  function selectRoom(roomCode, isUserAction) {
    const room = ROOMS_CONFIG.find(r => r.room === roomCode);
    if (!room) return;

    currentRoomCode = room.room;
    currentRoomObj = room;
    localStorage.setItem('anbk_selected_room', room.room);

    // Request desktop notification permission if supported
    if (isUserAction) requestDesktopNotificationPermission();

    // Update Topbar Display: Proctor ID & Room
    const proctorIdEl = document.getElementById('activeProctorId');
    const roomBadge = document.getElementById('activeRoomBadge');
    const avatarBadge = document.getElementById('avatarRoleBadge');

    if (proctorIdEl) {
      proctorIdEl.textContent = room.proctorId;
    }
    if (roomBadge) {
      roomBadge.textContent = room.room.replace('R', 'Ruang ');
    }
    if (avatarBadge) {
      avatarBadge.title = `${room.room.replace('R', 'Ruang ')} (${room.name}) - Klik untuk ganti ruangan`;
    }

    // Pastikan panel aktif adalah tampilan resmi ANBK / view saat ini
    const targetPanel = document.getElementById(activeView) || document.getElementById('anbkView');
    if (targetPanel) {
      document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
      targetPanel.classList.add('active');
    }

    // Set selektor grup ruangan aktif
    activeAnbkProctor = String(room.groupId);

    const labelMap = {
      anbkView: 'List Status Tes',
      boardView: 'Monitor Kartu Token',
      sheetView: 'Format Spreadsheet'
    };
    const currentViewLabel = document.getElementById('currentViewLabel');
    if (currentViewLabel) currentViewLabel.textContent = labelMap[activeView] || 'List Status Tes';

    // Kontrol Polling Sinyal: Aktif untuk respon cepat antar perangkat
    startFastRequestPolling();

    renderAnbkTableView();
    closeModal('roomSelectGate');
    renderGateRooms();

    if (isUserAction) {
      showToast(`Ruangan diatur ke ${room.room.replace('R', 'Ruang ')} (${room.name})`, 'success');
      fetchLatestTokens(false);
    }
  }

  // --- FAST POLLING REQUESTS & SIGNALS (1.5 - 2.5 DETIK RESPONS INSTAN) ---
  function startFastRequestPolling() {
    if (fastPollTimer) clearInterval(fastPollTimer);

    const intervalMs = (currentRoomObj && currentRoomObj.role === 'utama') ? 1500 : 2500;
    fastPollTimer = setInterval(() => {
      if (!settings.gasUrl || !currentRoomObj) return;
      checkIncomingRequestsFast();
    }, intervalMs);
  }

  async function checkIncomingRequestsFast() {
    try {
      const url = `${settings.gasUrl}${settings.gasUrl.includes('?') ? '&' : '?'}action=check_requests&targetRoom=${encodeURIComponent(currentRoomObj.room)}&proctorId=${encodeURIComponent(currentRoomObj.proctorId)}&_t=${Date.now()}`;
      const response = await fetch(url, { method: 'GET', cache: 'no-store' });
      if (!response.ok) return;

      const resJson = await response.json();
      if (resJson && resJson.status === 'success') {
        handleIncomingRequests(resJson.activeRequests || [], resJson.resetConfirmation || null);
      }
    } catch (e) {
      // silent network catch
    }
  }

  // --- NATIVE DESKTOP PUSH NOTIFICATION (SILENT, HANYA SAAT TAB DI BELAKANG) ---
  function requestDesktopNotificationPermission() {
    if (!settings.desktopNotificationsEnabled || !('Notification' in window) || Notification.permission !== 'default') return;
    try {
      Notification.requestPermission().catch(console.warn);
    } catch (e) {
      console.warn('Request notification error:', e);
    }
  }

  function showDesktopNotification(title, body, tag, onClickCallback) {
    // HANYA muncul jika browser sedang berada di tab lain atau aplikasi lain
    if (!settings.desktopNotificationsEnabled || !document.hidden) {
      return; // Tab sedang aktif di depan, notifikasi visual web sudah tampil
    }

    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body: body,
          icon: 'img/anbk-logo.png',
          tag: tag || ('anbk-req-' + Date.now()),
          silent: true // Strictly silent: no sound alert per user preference
        });

        notif.onclick = function () {
          window.focus();
          if (typeof onClickCallback === 'function') {
            onClickCallback();
          }
          this.close();
        };
      } catch (err) {
        console.warn('Gagal memicu push notifikasi desktop:', err);
      }
    }
  }

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
    if (typeof settings.desktopNotificationsEnabled !== 'boolean') settings.desktopNotificationsEnabled = true;

    // Pastikan terhubung langsung ke backend GAS aktif pada setiap device
    if (!settings.gasUrl || typeof settings.gasUrl !== 'string' || !settings.gasUrl.includes('/macros/s/') || !settings.gasUrl.includes('AKfycbwUzzj_Gh17fBAZ29zJ8vVoprzZFBh6vm_8Y1TzI1wbzlWiYa6ygw-Z5XcQhzSjHi0rIA')) {
      settings.gasUrl = DEFAULT_GAS_URL;
      try {
        localStorage.setItem('anbk_token_settings', JSON.stringify(settings));
      } catch (e) {}
    }

    const gasInput = document.getElementById('gasUrlInput');
    const intervalSelect = document.getElementById('refreshIntervalSelect');
    const desktopSelect = document.getElementById('desktopNotifSelect');
    const audioBtn = document.getElementById('btnAudioToggle');

    if (gasInput) gasInput.value = settings.gasUrl || DEFAULT_GAS_URL;
    if (intervalSelect) intervalSelect.value = String(settings.refreshInterval);
    if (desktopSelect) desktopSelect.value = String(settings.desktopNotificationsEnabled);
    if (audioBtn) audioBtn.classList.toggle('active', settings.soundEnabled);

    updateConnectionStatusPill();
  }

  function saveSettings() {
    const gasInput = document.getElementById('gasUrlInput');
    const intervalSelect = document.getElementById('refreshIntervalSelect');
    const desktopSelect = document.getElementById('desktopNotifSelect');

    settings.gasUrl = (gasInput ? gasInput.value.trim() : '');
    settings.refreshInterval = parseInt(intervalSelect ? intervalSelect.value : '5', 10);
    if (desktopSelect) settings.desktopNotificationsEnabled = desktopSelect.value === 'true';

    try {
      localStorage.setItem('anbk_token_settings', JSON.stringify(settings));
    } catch (e) {
      console.warn('Gagal menyimpan pengaturan:', e);
    }

    const audioBtn = document.getElementById('btnAudioToggle');
    if (audioBtn) audioBtn.classList.toggle('active', settings.soundEnabled);

    requestDesktopNotificationPermission();

    showToast('Pengaturan berhasil disimpan!', 'success');
    closeModal('settingsModal');

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
    groupsData = JSON.parse(JSON.stringify(DEFAULT_GROUPS));
  }

  function saveCachedTokens() {
    try {
      localStorage.setItem('anbk_cached_tokens', JSON.stringify(groupsData));
    } catch (e) {
      console.warn('Gagal menyimpan cache token:', e);
    }
  }

  // --- LOCAL REQUEST HISTORY ---
  function loadStoredRequestHistory() {
    try {
      const stored = localStorage.getItem('anbk_request_history');
      if (stored) {
        requestHistory = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Gagal memuat history request:', e);
    }
  }

  function saveRequestHistory() {
    try {
      localStorage.setItem('anbk_request_history', JSON.stringify(requestHistory.slice(0, 30)));
    } catch (e) {
      console.warn('Gagal menyimpan history request:', e);
    }
  }

  // --- AUDIO SYNTHESIS NOTIFICATION (Only used when Token Updates, NOT for incoming requests) ---
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
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(audioContext.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      // Note 2: A5 (880.00 Hz)
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.1);
      gain2.gain.setValueAtTime(0.15, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.5);

    } catch (err) {
      console.warn('Audio playback error:', err);
    }
  }

  // --- SYNC & POLLING ENGINE ---
  function startSyncLoop() {
    if (countdownTimer) clearInterval(countdownTimer);

    if (settings.refreshInterval <= 0) {
      const secEl = document.getElementById('countdownSec');
      if (secEl) secEl.textContent = 'OFF';
      return;
    }

    remainingSeconds = settings.refreshInterval;
    updateCountdownUI();

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
    const fetchVersion = tokenDataVersion;

    const refreshBtn = document.getElementById('btnManualRefresh');
    if (refreshBtn) refreshBtn.classList.add('loading');

    const updateClock = document.getElementById('lastUpdatedClock');
    const nowTimeStr = new Date().toLocaleTimeString('id-ID');

    if (!settings.gasUrl) {
      setTimeout(() => {
        if (updateClock) updateClock.textContent = nowTimeStr;
        if (refreshBtn) refreshBtn.classList.remove('loading');
        isFetching = false;
        if (isManual) showToast('Data diperbarui (Mode Offline / Demo)', 'info');
      }, 400);
      return;
    }

    try {
      const targetParam = currentRoomCode ? `&targetRoom=${encodeURIComponent(currentRoomCode)}` : '';
      const fetchUrl = `${settings.gasUrl}${settings.gasUrl.includes('?') ? '&' : '?'}action=get${targetParam}&_t=${Date.now()}`;
      
      const response = await fetch(fetchUrl, {
        method: 'GET',
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const resJson = await response.json();

      if (resJson && resJson.status === 'success' && Array.isArray(resJson.data)) {
        if (fetchVersion === tokenDataVersion) handleIncomingData(resJson.data);
        handleIncomingRequests(resJson.activeRequests || [], resJson.resetConfirmation || null);
        updateConnectionStatusPill('online', 'LIVE SINKRON');
        if (updateClock) updateClock.textContent = nowTimeStr;
        if (isManual) showToast('Data token & status tes berhasil disinkronkan!', 'success');
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

          // Notifikasi jika Proktor Bayangan menerima rilis token baru untuk ruangannya
          if (currentRoomObj && currentRoomObj.groupId === local.id && currentRoomObj.role === 'bayangan') {
            showToast(`🔑 Token Tes Baru Telah Dirilis oleh Proktor Utama: "${incomingToken}"`, 'success');
            if (document.hidden) {
              showDesktopNotification(
                `🔑 Token Baru ANBK Dirilis (${currentRoomObj.partnerRoom || 'Utama'})`,
                `Proktor Utama telah merilis token baru: ${incomingToken}. Segera bagikan ke peserta.`,
                'token-update-' + incomingToken
              );
            }
          }
        }
      }
    });

    if (hasChanges) {
      saveCachedTokens();
      renderAllViews();
      playTokenAlertSound();

      changedGroupIds.forEach(gid => {
        const card = document.querySelector(`.token-card[data-group="${gid}"]`);
        if (card) {
          card.classList.add('updated-pulse');
          setTimeout(() => card.classList.remove('updated-pulse'), 1500);
        }
      });
    }
  }

  // --- TARGETED INCOMING REQUESTS & RESET CONFIRMATION HANDLER ---
  function handleIncomingRequests(activeRequests, resetConfirmation) {
    if (!currentRoomObj) return;

    const nowMs = Date.now();

    if (currentRoomObj.role === 'utama') {
      // PROKTOR UTAMA: Hanya proses permintaan yang ditujukan ke ruangan dan proktorId ini!
      const myTargetedRequests = (activeRequests || []).filter(req => {
        const statusPending = (req.status || 'PENDING') === 'PENDING';
        const targetMatch = req.targetRoom === currentRoomObj.room;
        const proctorMatch = req.proctorId === currentRoomObj.proctorId;

        // Cek umur request: abaikan request yang lebih lama dari 5 menit
        let reqTimeMs = 0;
        const idMatch = String(req.requestId || '').match(/REQ-(?:TOK-|RST-)?(\d+)/);
        if (idMatch && idMatch[1]) {
          reqTimeMs = parseInt(idMatch[1], 10);
        }
        const isFresh = (reqTimeMs === 0) || (nowMs - reqTimeMs < 5 * 60 * 1000);

        return statusPending && targetMatch && proctorMatch && isFresh;
      });

      if (myTargetedRequests.length > 0) {
        const latestReq = myTargetedRequests[0];

        // Trigger desktop push notification & popup if not yet alerted in this session
        if (!alertedRequestIds.has(latestReq.requestId)) {
          alertedRequestIds.add(latestReq.requestId);
          saveAlertedRequestIds();

          const isReset = latestReq.type === 'RESET';
          const notifTitle = isReset
            ? `⚠️ [${latestReq.fromRoom}] Permintaan Reset Login Peserta`
            : `🔔 [${latestReq.fromRoom}] Permintaan Rilis Token Baru`;

          const notifBody = `${latestReq.fromProctor || 'Proktor Bayangan'}: ${latestReq.detail || 'Mohon segera diproses di Proktor Browser.'}`;

          // Native Browser Desktop Push Notification (Hanya jika tab di belakang)
          if (document.hidden) {
            showDesktopNotification(notifTitle, notifBody, latestReq.requestId, () => {
              openIncomingRequestModal(latestReq);
            });
          }

          // Open In-App Visual Alert Modal (Floating di pojok kanan atas)
          openIncomingRequestModal(latestReq);
        }
      }
    } else if (currentRoomObj.role === 'bayangan') {
      // PROKTOR BAYANGAN: Cek apakah ada konfirmasi reset login dari Proktor Utama
      if (resetConfirmation && resetConfirmation.id) {
        const matchTarget = !resetConfirmation.targetRoom || resetConfirmation.targetRoom === currentRoomObj.room;
        const matchProctor = !resetConfirmation.proctorId || resetConfirmation.proctorId === currentRoomObj.proctorId;
        const notFromMe = resetConfirmation.fromRoom !== currentRoomObj.room;

        // Cek umur konfirmasi (< 5 menit)
        const confTimeMs = resetConfirmation.timeMs || 0;
        const isFresh = (confTimeMs === 0) || (nowMs - confTimeMs < 5 * 60 * 1000);

        if (matchTarget && matchProctor && notFromMe && isFresh && resetConfirmation.id !== lastResetConfirmId) {
          lastResetConfirmId = resetConfirmation.id;
          try {
            sessionStorage.setItem('anbk_last_reset_confirm_id', lastResetConfirmId);
          } catch (e) {}

          const fromStr = resetConfirmation.fromRoom ? ` (${resetConfirmation.fromRoom})` : '';
          showToast(`✅ Proktor Utama${fromStr} telah menyelesaikan reset login peserta!`, 'success');

          if (document.hidden) {
            showDesktopNotification(
              `✅ Reset Login Peserta Selesai${fromStr}`,
              `Proktor Utama telah mengonfirmasi bahwa reset login peserta selesai diproses di Proktor Browser.`,
              resetConfirmation.id
            );
          }
        }
      }
    }
  }

  // --- ACTIONS: PROKTOR BAYANGAN REQUESTS ---
  async function sendGasAction(params) {
    if (!settings.gasUrl) throw new Error('URL backend belum diatur.');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const query = new URLSearchParams(Object.assign({}, params, { _t: Date.now() }));
      const url = `${settings.gasUrl}${settings.gasUrl.includes('?') ? '&' : '?'}${query}`;
      const response = await fetch(url, { method: 'GET', cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (!result || result.status !== 'success') {
        throw new Error((result && result.message) || 'Backend belum mengonfirmasi keberhasilan.');
      }
      return result;
    } catch (err) {
      if (err.name === 'AbortError') throw new Error('Koneksi ke server melewati batas waktu.');
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function sendTokenRequest() {
    if (!currentRoomObj || currentRoomObj.role !== 'bayangan' || isSendingTokenRequest) return;
    const room = currentRoomObj;
    isSendingTokenRequest = true;

    const reqId = 'REQ-TOK-' + Date.now();
    const nowStr = new Date().toLocaleTimeString('id-ID');

    const newReq = {
      id: reqId,
      time: nowStr,
      type: 'TOKEN',
      detail: 'Mohon segera rilis / update token tes baru untuk sesi ini',
      status: 'PENDING',
      targetRoom: currentRoomObj.partnerRoom,
      fromRoom: currentRoomObj.room
    };

    showToast(`Mengirim permintaan token ke Proktor Utama (${room.partnerRoom})...`, 'info');
    try {
      const result = await sendGasAction({
        action: 'create_request', fromRoom: room.room, targetRoom: room.partnerRoom,
        proctorId: room.proctorId, groupId: room.groupId, type: 'TOKEN',
        detail: newReq.detail, fromProctor: room.name
      });
      newReq.id = result.requestId || reqId;
      requestHistory.unshift(newReq);
      saveRequestHistory();
      showToast(`Permintaan rilis token baru telah terkirim ke Proktor Utama (${room.partnerRoom}). Menunggu rilis token...`, 'info');
    } catch (err) {
      console.warn('Gagal kirim request token ke GAS:', err);
      showToast(`Permintaan token belum terkonfirmasi: ${err.message}. Klik kembali menu Daftar Peserta untuk mencoba lagi.`, 'error');
    } finally {
      isSendingTokenRequest = false;
    }
  }

  function openResetRequestModal() {
    if (!currentRoomObj || currentRoomObj.role !== 'bayangan') return;

    const subtitle = document.getElementById('resetModalTargetSubtitle');
    if (subtitle) {
      subtitle.textContent = `Target: Proktor Utama (${currentRoomObj.partnerRoom} - ${currentRoomObj.partnerName})`;
    }

    const nameInput = document.getElementById('resetStudentName');
    const idInput = document.getElementById('resetStudentId');
    const pcInput = document.getElementById('resetComputerNo');

    if (nameInput) {
      nameInput.value = '';
      setTimeout(() => nameInput.focus(), 100);
    }
    if (idInput) idInput.value = '';
    if (pcInput) pcInput.value = '';

    openModal('modalRequestReset');
  }

  async function handleResetFormSubmit(e) {
    e.preventDefault();
    if (!currentRoomObj || currentRoomObj.role !== 'bayangan') return;

    const studentNameInput = document.getElementById('resetStudentName');
    const studentIdInput = document.getElementById('resetStudentId');
    const pcNoInput = document.getElementById('resetComputerNo');
    const problemSelect = document.getElementById('resetProblemType');
    const submitBtn = document.getElementById('submitResetRequestBtn');
    const submitSpinner = document.getElementById('submitResetSpinner');
    const submitText = document.getElementById('btnSubmitResetText');
    if (submitBtn && submitBtn.disabled) return;
    const room = currentRoomObj;

    // HANYA NAMA PESERTA YANG WAJIB
    const studentName = studentNameInput ? studentNameInput.value.trim() : '';
    const studentId = studentIdInput ? studentIdInput.value.trim().toUpperCase() : '';
    const pcNo = pcNoInput ? pcNoInput.value.trim() : '';
    const problem = problemSelect ? problemSelect.value : 'Logout / Keluar Sendiri';

    if (!studentName) {
      showToast('Nama Peserta wajib diisi!', 'error');
      if (studentNameInput) studentNameInput.focus();
      return;
    }

    if (submitSpinner) submitSpinner.style.display = 'inline-block';
    if (submitText) submitText.textContent = 'Mengirim...';
    if (submitBtn) submitBtn.disabled = true;

    const detailText = `Nama: ${studentName}${pcNo ? ' | PC: ' + pcNo : ''}${studentId ? ' | No: ' + studentId : ''} | Kendala: ${problem}`;
    const reqId = 'REQ-RST-' + Date.now();
    const nowStr = new Date().toLocaleTimeString('id-ID');

    const newReq = {
      id: reqId,
      time: nowStr,
      type: 'RESET',
      studentName: studentName,
      studentId: studentId,
      detail: detailText,
      status: 'PENDING',
      targetRoom: currentRoomObj.partnerRoom,
      fromRoom: currentRoomObj.room
    };

    try {
      const result = await sendGasAction({
        action: 'create_request', fromRoom: room.room, targetRoom: room.partnerRoom,
        proctorId: room.proctorId, groupId: room.groupId, type: 'RESET',
        detail: detailText, fromProctor: room.name
      });
      newReq.id = result.requestId || reqId;
      requestHistory.unshift(newReq);
      saveRequestHistory();
      closeModal('modalRequestReset');
      showToast(`Permintaan reset login untuk peserta "${studentName}" telah terkirim ke Proktor Utama (${room.partnerRoom}). Menunggu konfirmasi reset...`, 'info');
    } catch (err) {
      console.warn('Gagal kirim reset ke GAS:', err);
      showToast(`Permintaan reset belum terkonfirmasi: ${err.message}. Isian tetap tersimpan; silakan klik Kirim Permintaan Reset untuk mencoba lagi.`, 'error');
    } finally {
      if (submitSpinner) submitSpinner.style.display = 'none';
      if (submitText) submitText.textContent = 'Kirim Permintaan Reset';
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  // --- ACTIONS: PROKTOR UTAMA INCOMING REQUEST MODAL ---
  function openIncomingRequestModal(req) {
    const icon = document.getElementById('incomingAlertIcon');
    const title = document.getElementById('incomingAlertTitle');
    const subtitle = document.getElementById('incomingAlertSubtitle');
    const detailCard = document.getElementById('incomingDetailCard');
    const actionsRow = document.getElementById('incomingActionsRow');

    const isReset = req.type === 'RESET';

    if (icon) icon.textContent = isReset ? '⚠️' : '🔑';
    if (title) title.textContent = isReset ? 'Permintaan Reset Login Peserta Masuk!' : 'Permintaan Rilis Token Baru Masuk!';
    if (subtitle) {
      subtitle.textContent = `Dari: ${req.fromRoom} (${req.fromProctor || 'Proktor Bayangan'}) • ${req.timestamp || new Date().toLocaleTimeString('id-ID')} WIB`;
    }

    // Extract student Name and ID if reset
    let studentNameMatch = '';
    let studentIdMatch = '';
    if (isReset && req.detail) {
      const nameMatch = req.detail.match(/Nama:\s*([^|]+)/i);
      if (nameMatch && nameMatch[1]) studentNameMatch = nameMatch[1].trim();

      const idMatch = req.detail.match(/No:\s*([^|]+)/i) || req.detail.match(/No Peserta:\s*([^|]+)/i);
      if (idMatch && idMatch[1] && idMatch[1].trim() !== '-') studentIdMatch = idMatch[1].trim();
    }

    if (detailCard) {
      detailCard.innerHTML = `
        <div class="incoming-detail-row">
          <span class="detail-label">Ruang Pengirim</span>
          <span class="detail-value">${escapeHtml(req.fromRoom)} (${escapeHtml(req.fromProctor || 'Proktor Bayangan')})</span>
        </div>
        <div class="incoming-detail-row">
          <span class="detail-label">Jenis Permintaan</span>
          <span class="detail-value" style="color: ${isReset ? '#ea580c' : '#0284c7'}; font-weight: 700;">${isReset ? 'RESET LOGIN PESERTA' : 'RILIS / UPDATE TOKEN'}</span>
        </div>
        ${studentNameMatch ? `
          <div class="incoming-detail-row">
            <span class="detail-label">Nama Peserta</span>
            <span class="detail-value detail-value-highlight">${escapeHtml(studentNameMatch)}</span>
          </div>
        ` : ''}
        ${studentIdMatch ? `
          <div class="incoming-detail-row">
            <span class="detail-label">No Peserta / ID</span>
            <span class="detail-value">${escapeHtml(studentIdMatch)}</span>
          </div>
        ` : ''}
        <div class="incoming-detail-row" style="flex-direction: column; align-items: flex-start; gap: 4px;">
          <span class="detail-label">Rincian / Kendala:</span>
          <span class="detail-value" style="text-align: left; font-size: 0.8rem; font-weight: 500; color: #334155;">${escapeHtml(req.detail)}</span>
        </div>
      `;
    }

    if (actionsRow) {
      let buttonsHtml = '';

      if (isReset) {
        const textToCopy = studentNameMatch || studentIdMatch || req.detail;
        buttonsHtml += `
          <button class="btn-copy-student-id" onclick="window.anbkApp.copyText('${escapeJs(textToCopy)}', 'Nama Peserta Tersalin!')">
            📋 Salin Nama
          </button>
        `;
        buttonsHtml += `
          <button class="btn-resolve-request" onclick="window.anbkApp.confirmResetFromUtama('${escapeJs(req.requestId)}')">
            ✓ Tandai Sudah Di-reset
          </button>
        `;
      } else {
        buttonsHtml += `
          <button class="btn-resolve-request" onclick="window.anbkApp.closeIncomingModal(); window.anbkApp.openUpdateModal(${currentRoomObj ? currentRoomObj.groupId : 1});">
            🔑 Update & Rilis Token
          </button>
        `;
      }

      buttonsHtml += `
        <button class="btn-incoming-close" onclick="window.anbkApp.closeIncomingModal()">
          Tutup
        </button>
      `;

      actionsRow.innerHTML = buttonsHtml;
    }

    openModal('incomingRequestModal');
  }

  async function confirmResetFromUtama(requestId) {
    if (!currentRoomObj || currentRoomObj.role !== 'utama' || isConfirmingReset) return;
    const room = currentRoomObj;
    isConfirmingReset = true;

    const partner = currentRoomObj.partnerRoom || 'Proktor Bayangan';
    showToast(`Mengirim sinyal konfirmasi reset login ke ${partner}...`, 'info');

    try {
      await sendGasAction({
        action: 'confirm_reset', fromRoom: room.room, targetRoom: room.partnerRoom || '',
        proctorId: room.proctorId, requestId: requestId || '',
        detail: 'Reset login peserta telah selesai diproses oleh Proktor Utama.'
      });
      if (requestId) {
        alertedRequestIds.add(requestId);
        saveAlertedRequestIds();
      }
      closeModal('incomingRequestModal');
      showToast(`✓ Sinyal konfirmasi reset berhasil dikirim ke ${partner}!`, 'success');
    } catch (err) {
      console.warn('Gagal confirm reset ke GAS:', err);
      showToast(`Konfirmasi reset belum terkonfirmasi: ${err.message}. Silakan coba lagi.`, 'error');
    } finally {
      isConfirmingReset = false;
    }
  }

  async function resolveRequest(requestId) {
    showToast('Menandai permintaan selesai...', 'info');
    try {
      await sendGasAction({ action: 'resolve_request', requestId });
      alertedRequestIds.add(requestId);
      saveAlertedRequestIds();
      closeModal('incomingRequestModal');
      showToast('Permintaan berhasil ditandai selesai!', 'success');
    } catch (err) {
      console.warn('Gagal resolve request di GAS:', err);
      showToast(`Permintaan belum ditandai selesai: ${err.message}. Silakan coba lagi.`, 'error');
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
      if (currentFilter !== 'all' && String(g.id) !== String(currentFilter)) return false;
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
            <span class="anbk-token-badge" style="cursor: pointer;" title="Klik untuk salin token" onclick="window.anbkApp.copyToken('${escapeJs(g.token)}', this)">${escapeHtml(g.token)}</span>
          </td>
        </tr>
      `;

      // Row 2 (Sesi 2 - matching official ANBK screenshot with Rilis Token button)
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
      const numRows = g.proctors.length;

      g.proctors.forEach((proctor, idx) => {
        const isFirst = (idx === 0);
        const bgClass = `group-bg-${g.id}`;

        html += `<tr class="${bgClass}">`;
        html += `<td style="font-weight: 600;">${escapeHtml(proctor.name)}</td>`;

        if (isFirst) {
          html += `<td rowspan="${numRows}" class="sheet-center-cell" style="font-weight: 600;">${escapeHtml(g.proctorId)}</td>`;
          html += `<td rowspan="${numRows}" class="sheet-center-cell">${escapeHtml(g.password)}</td>`;
        }

        html += `<td class="sheet-room-cell">${escapeHtml(proctor.room)}</td>`;

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
    if (submitBtn && submitBtn.disabled) return;

    const groupId = parseInt(hiddenId.value, 10);
    const newToken = tokenInput.value.trim().toUpperCase();
    const updaterName = (updaterInput.value.trim() || (currentRoomObj ? currentRoomObj.name : 'Proktor Web'));

    if (!/^[A-Z]{6}$/.test(newToken)) {
      showToast('Token harus tepat 6 huruf kapital (A–Z).', 'error');
      return;
    }

    const group = groupsData.find(g => g.id === groupId);
    if (!group) {
      showToast('Grup ruangan tidak ditemukan.', 'error');
      return;
    }

    if (submitSpinner) submitSpinner.style.display = 'inline-block';
    if (submitText) submitText.textContent = 'Menyimpan...';
    if (submitBtn) submitBtn.disabled = true;

    // Tampilkan token baru hanya setelah backend mengonfirmasi penyimpanan.
    try {
      const result = await sendGasAction({ action: 'update', groupId, token: newToken, updatedBy: updaterName });
      tokenDataVersion++;
      group.token = newToken;
      group.lastUpdated = result.updatedAt || new Date().toLocaleTimeString('id-ID') + ' WIB';
      saveCachedTokens();
      renderAllViews();
      playTokenAlertSound();
      closeModal('updateTokenModal');
      showToast(`Token untuk ${group.roomsLabel} berhasil diperbarui di Google Sheets!`, 'success');
    } catch (err) {
      console.warn('Gagal push ke GAS:', err);
      showToast(`Token belum tersinkron: ${err.message}. Token aktif tetap dipertahankan; klik Simpan & Bagikan Token untuk mencoba lagi.`, 'error');
    } finally {
      if (submitSpinner) submitSpinner.style.display = 'none';
      if (submitText) submitText.textContent = 'Simpan & Bagikan Token';
      if (submitBtn) submitBtn.disabled = false;
    }
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

  async function copyText(textToCopy, successMsg) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      showToast(successMsg || 'Teks berhasil disalin!', 'success');
    } catch (e) {
      showToast('Gagal menyalin teks.', 'error');
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
    showToast('Data berhasil direset kembali ke susunan awal.', 'info');
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

    // Topbar Profile Badge (Klik untuk Ganti / Pilih Ruangan)
    const userProfileBadge = document.getElementById('userProfileBadge');
    if (userProfileBadge) {
      userProfileBadge.addEventListener('click', () => openModal('roomSelectGate'));
    }

    // Manual Refresh Button
    const refreshBtn = document.getElementById('btnManualRefresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        fetchLatestTokens(true);
      });
    }

    // View Mode Switcher Tabs (Tampilan Resmi ANBK / Monitor Kartu / Spreadsheet)
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

    // Search Input (Board View)
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value.trim();
        renderBoardView();
      });
    }

    // Fullscreen Toggle
    const btnFullscreen = document.getElementById('btnFullscreenToggle');
    const expandIcon = document.getElementById('fullscreenExpandIcon');
    const compressIcon = document.getElementById('fullscreenCompressIcon');
    const fullscreenText = document.getElementById('fullscreenBtnText');

    if (btnFullscreen) {
      btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(err => {
            console.warn('Gagal fullscreen:', err);
          });
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          }
        }
      });

      document.addEventListener('fullscreenchange', () => {
        const isFs = !!document.fullscreenElement;
        if (expandIcon) expandIcon.style.display = isFs ? 'none' : 'inline-block';
        if (compressIcon) compressIcon.style.display = isFs ? 'inline-block' : 'none';
        if (fullscreenText) fullscreenText.textContent = isFs ? 'Keluar' : 'Layar Penuh';
        btnFullscreen.title = isFs ? 'Keluar dari Layar Penuh' : 'Mode Layar Penuh (Fullscreen)';
      });
    }

    // Close Incoming Request Alert Modal Button
    const btnCloseIncoming = document.getElementById('btnCloseIncomingModal');
    if (btnCloseIncoming) {
      btnCloseIncoming.addEventListener('click', () => closeModal('incomingRequestModal'));
    }

    // Sidebar Navigation: Terhubung Langsung Sesuai Alur Proktor ANBK
    const navDaftarPeserta = document.getElementById('navDaftarPeserta');
    if (navDaftarPeserta) {
      navDaftarPeserta.addEventListener('click', (e) => {
        e.preventDefault();
        if (!currentRoomObj) {
          openModal('roomSelectGate');
          return;
        }
        if (currentRoomObj.role === 'bayangan') {
          // Proktor Bayangan -> Minta Token Baru ke Proktor Utama
          sendTokenRequest();
        } else {
          // Proktor Utama -> Buka Modal Rilis / Update Token
          openUpdateModal(currentRoomObj.groupId);
          showToast(`Anda adalah Proktor Utama (${currentRoomObj.room}). Silakan update / rilis token baru.`, 'info');
        }
      });
    }

    const navRequestReset = document.getElementById('navRequestReset');
    if (navRequestReset) {
      navRequestReset.addEventListener('click', (e) => {
        e.preventDefault();
        if (!currentRoomObj) {
          openModal('roomSelectGate');
          return;
        }
        if (currentRoomObj.role === 'bayangan') {
          // Proktor Bayangan -> Form Request Reset Peserta
          openResetRequestModal();
        } else {
          // Proktor Utama -> Beri sinyal konfirmasi ke Proktor Bayangan bahwa reset login sudah selesai
          confirmResetFromUtama();
        }
      });
    }

    // Generic Sidebar Nav Items (Cegah lompat halaman & aktifkan status-tes)
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const tab = item.getAttribute('data-tab');
        if (tab === 'status-tes') {
          e.preventDefault();
          document.querySelectorAll('.sidebar-nav .nav-item').forEach(i => i.classList.remove('active'));
          item.classList.add('active');
          const anbkTabBtn = document.querySelector('.view-tab-btn[data-view="anbkView"]');
          if (anbkTabBtn) anbkTabBtn.click();
        } else if (tab !== 'daftar-peserta' && tab !== 'request-reset') {
          e.preventDefault();
          showToast(`Menu "${item.querySelector('.nav-label')?.textContent || tab}" dibuka di tampilan proktor.`, 'info');
        }
      });
    });

    // Reset Modal Form & Close
    const closeResetModalBtn = document.getElementById('closeResetModalBtn');
    const cancelResetModalBtn = document.getElementById('cancelResetModalBtn');
    if (closeResetModalBtn) closeResetModalBtn.addEventListener('click', () => closeModal('modalRequestReset'));
    if (cancelResetModalBtn) cancelResetModalBtn.addEventListener('click', () => closeModal('modalRequestReset'));

    const formRequestReset = document.getElementById('formRequestReset');
    if (formRequestReset) formRequestReset.addEventListener('submit', handleResetFormSubmit);

    // Modals Close on backdrop click (Except Gate)
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          if (modal.id === 'roomSelectGate') {
            if (currentRoomCode) closeModal(modal.id);
          } else {
            closeModal(modal.id);
          }
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

  // Expose to window for inline HTML onclicks
  window.anbkApp = {
    openUpdateModal,
    copyToken,
    copyText,
    resolveRequest,
    confirmResetFromUtama,
    closeIncomingModal: () => closeModal('incomingRequestModal')
  };

})();

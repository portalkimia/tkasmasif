/**
 * ============================================================================
 * BACKEND GOOGLE APPS SCRIPT (GAS) - ANBK REALTIME TOKEN & COORDINATION API
 * ============================================================================
 * Fitur:
 * 1. Manajemen Token Tes Antar Ruang Berpasangan (R1-R2, R3-R4, R5-R6, R7, R8-R9, R10-R11)
 * 2. Sistem Request Token Terbaru dari Proktor Bayangan ke Proktor Utama (Terarah per Proktor ID)
 * 3. Sistem Request Reset Login Peserta dari Proktor Bayangan ke Proktor Utama
 * 4. Log Riwayat Permintaan & Status Penyelesaian
 * ============================================================================
 */

const SHEET_NAME = 'DATA_TOKEN';
const REQUEST_SHEET_NAME = 'REQUEST_LOG';
// Versi baru membangun ulang cache lama yang mungkin kehilangan permintaan.
const ACTIVE_REQUESTS_CACHE_KEY = 'ACTIVE_REQUESTS_CACHE_V2';

/** Semua penulis dan pembentuk ulang cache memakai kunci script yang sama. */
function withRequestStateLock(work) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) {
    throw new Error('Server sedang memproses permintaan lain. Silakan coba lagi.');
  }
  try {
    const result = work();
    if (result && result.status === 'error') {
      try { CacheService.getScriptCache().remove(ACTIVE_REQUESTS_CACHE_KEY); } catch (e) {}
    }
    return result;
  } catch (error) {
    try { CacheService.getScriptCache().remove(ACTIVE_REQUESTS_CACHE_KEY); } catch (e) {}
    throw error;
  } finally {
    try {
      SpreadsheetApp.flush();
    } catch (error) {
      try { CacheService.getScriptCache().remove(ACTIVE_REQUESTS_CACHE_KEY); } catch (e) {}
      throw error;
    } finally {
      lock.releaseLock();
    }
  }
}

function readActiveRequestsCache() {
  try {
    const raw = CacheService.getScriptCache().get(ACTIVE_REQUESTS_CACHE_KEY);
    if (raw !== null) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list;
    }
  } catch (e) {}
  return null;
}

/** Dipanggil hanya saat kunci dipegang, setelah perubahan Sheet di-flush. */
function refreshActiveRequestsCacheLocked() {
  const list = getActiveRequests('');
  try {
    CacheService.getScriptCache().put(ACTIVE_REQUESTS_CACHE_KEY, JSON.stringify(list), 21600);
  } catch (error) {
    // Sheet tetap menjadi sumber data jika cache gagal atau terlalu besar.
    try { CacheService.getScriptCache().remove(ACTIVE_REQUESTS_CACHE_KEY); } catch (e) {}
  }
  return list;
}

/**
 * Handle GET request untuk membaca data token secara realtime,
 * mengambil request aktif, serta membuat/menyelesaikan request via GET.
 */
function doGet(e) {
  try {
    const params = e ? e.parameter : {};
    const action = params.action || 'get';

    // Action: Inisialisasi otomatis jika sheet belum ada
    if (action === 'init') {
      withRequestStateLock(function () {
        setupSheet();
        setupRequestSheet();
        SpreadsheetApp.flush();
        refreshActiveRequestsCacheLocked();
      });
      return createJsonResponse({
        status: 'success',
        message: 'Sheet berhasil diinisialisasi!',
        data: getTokensData(),
        activeRequests: []
      });
    }

    // Action: Update token
    if (action === 'update') {
      const groupId = params.groupId;
      const newToken = (params.token || '').trim().toUpperCase();
      const updatedBy = params.updatedBy || 'Web ANBK';

      if (!groupId || !newToken) {
        return createJsonResponse({
          status: 'error',
          message: 'Parameter groupId dan token wajib diisi.'
        });
      }

      const result = updateTokenInSheet(groupId, newToken, updatedBy);
      return createJsonResponse(result);
    }

    // Action: Buat Permintaan Baru (Request Token / Reset Login) dari Proktor Bayangan
    if (action === 'create_request') {
      const fromRoom = params.fromRoom || '';
      const targetRoom = params.targetRoom || '';
      const proctorId = params.proctorId || '';
      const groupId = params.groupId || '';
      const type = params.type || 'TOKEN'; // 'TOKEN' atau 'RESET'
      const detail = params.detail || '';
      const fromProctor = params.fromProctor || '';

      if (!fromRoom || !targetRoom) {
        return createJsonResponse({
          status: 'error',
          message: 'Parameter fromRoom dan targetRoom wajib diisi.'
        });
      }

      const result = createRequestInSheet(fromRoom, targetRoom, proctorId, groupId, type, detail, fromProctor);
      return createJsonResponse(result);
    }

    // Action: Tandai Permintaan Selesai / Konfirmasi Reset Login oleh Proktor Utama
    if (action === 'resolve_request') {
      return createJsonResponse(resolveRequestInSheet(params.requestId || ''));
    }

    if (action === 'confirm_reset') {
      const requestId = params.requestId || '';
      const fromRoom = params.fromRoom || '';
      const targetRoom = params.targetRoom || '';
      const proctorId = params.proctorId || '';
      const detail = params.detail || 'Reset login peserta telah selesai diproses.';
      const result = confirmResetInSheet(fromRoom, targetRoom, proctorId, detail, requestId);
      return createJsonResponse(result);
    }

    // Action: Bersihkan Permintaan Pending Lama
    if (action === 'clear_requests') {
      const result = clearAllPendingRequests();
      return createJsonResponse(result);
    }

    // Action: Fast Check Requests (Super Cepat via CacheService)
    if (action === 'check_requests') {
      const targetRoomFilter = params.targetRoom || '';
      const proctorIdFilter = params.proctorId || '';
      const activeRequests = getActiveRequestsFast(targetRoomFilter, proctorIdFilter);

      let resetConfirmation = null;
      try {
        const cache = CacheService.getScriptCache();
        if (targetRoomFilter) {
          const rawConfirm = cache.get('CONFIRM_RESET_' + String(targetRoomFilter).trim());
          if (rawConfirm) {
            resetConfirmation = JSON.parse(rawConfirm);
          }
        }
      } catch (e) {}

      return createJsonResponse({
        status: 'success',
        activeRequests: activeRequests,
        resetConfirmation: resetConfirmation
      });
    }

    // Default action: Ambil data semua token + antrian permintaan aktif (PENDING)
    const targetRoomFilter = params.targetRoom || '';
    const proctorIdFilter = params.proctorId || '';
    const tokenData = getTokensData();
    const activeRequests = getActiveRequestsFast(targetRoomFilter, proctorIdFilter);

    let resetConfirmation = null;
    try {
      const cache = CacheService.getScriptCache();
      if (targetRoomFilter) {
        const rawConfirm = cache.get('CONFIRM_RESET_' + String(targetRoomFilter).trim());
        if (rawConfirm) {
          resetConfirmation = JSON.parse(rawConfirm);
        }
      }
    } catch (e) {}

    return createJsonResponse({
      status: 'success',
      timestamp: new Date().toISOString(),
      serverTime: Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss') + ' WIB',
      totalGroups: tokenData.length,
      data: tokenData,
      activeRequests: activeRequests,
      resetConfirmation: resetConfirmation
    });

  } catch (error) {
    return createJsonResponse({
      status: 'error',
      message: error.toString()
    });
  }
}

/**
 * Handle POST request
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (err) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action || 'update';

    if (action === 'update') {
      const groupId = payload.groupId;
      const newToken = (payload.token || '').trim().toUpperCase();
      const updatedBy = payload.updatedBy || 'Web ANBK';

      if (!groupId || !newToken) {
        return createJsonResponse({
          status: 'error',
          message: 'Parameter groupId dan token wajib diisi.'
        });
      }

      const result = updateTokenInSheet(groupId, newToken, updatedBy);
      return createJsonResponse(result);
    }

    if (action === 'create_request') {
      const result = createRequestInSheet(
        payload.fromRoom || '',
        payload.targetRoom || '',
        payload.proctorId || '',
        payload.groupId || '',
        payload.type || 'TOKEN',
        payload.detail || '',
        payload.fromProctor || ''
      );
      return createJsonResponse(result);
    }

    if (action === 'resolve_request') {
      const result = resolveRequestInSheet(payload.requestId || '');
      return createJsonResponse(result);
    }

    return createJsonResponse({
      status: 'error',
      message: 'Aksi tidak dikenali: ' + action
    });

  } catch (error) {
    return createJsonResponse({
      status: 'error',
      message: error.toString()
    });
  }
}

/**
 * Mengambil data token dari sheet DATA_TOKEN
 */
function getTokensData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    setupSheet();
    sheet = ss.getSheetByName(SHEET_NAME);
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const rawValues = sheet.getRange(2, 1, lastRow - 1, 6).getValues();

  const groupsDefinition = [
    { id: 1, name: 'Grup 1 (R1 & R2)', rooms: ['R1', 'R2'], rowStart: 2, rowEnd: 3, color: '#c6e0b4', darkColor: '#276749' },
    { id: 2, name: 'Grup 2 (R3 & R4)', rooms: ['R3', 'R4'], rowStart: 4, rowEnd: 5, color: '#bdd7ee', darkColor: '#2b6cb0' },
    { id: 3, name: 'Grup 3 (R5 & R6)', rooms: ['R5', 'R6'], rowStart: 6, rowEnd: 7, color: '#ffe699', darkColor: '#b7791f' },
    { id: 4, name: 'Grup 4 (R7)',       rooms: ['R7'],       rowStart: 8, rowEnd: 8, color: '#f8cbad', darkColor: '#c05621' },
    { id: 5, name: 'Grup 5 (R8 & R9)', rooms: ['R8', 'R9'], rowStart: 9, rowEnd: 10, color: '#e1d5e7', darkColor: '#6b46c1' },
    { id: 6, name: 'Grup 6 (R10 & R11)', rooms: ['R10', 'R11'], rowStart: 11, rowEnd: 12, color: '#d9d2e9', darkColor: '#553c9a' }
  ];

  const result = groupsDefinition.map(group => {
    const proctors = [];
    let proctorId = '';
    let password = '';
    let token = '';
    let lastUpdated = '';

    for (let r = group.rowStart; r <= group.rowEnd; r++) {
      const idx = r - 2;
      if (rawValues[idx]) {
        const rowData = rawValues[idx];
        const pengawas = rowData[0] ? String(rowData[0]).trim() : '';
        const rProctorId = rowData[1] ? String(rowData[1]).trim() : '';
        const rPassword = rowData[2] ? String(rowData[2]).trim() : '';
        const roomName = rowData[3] ? String(rowData[3]).trim() : '';
        const rToken = rowData[4] ? String(rowData[4]).trim() : '';
        const rUpdated = rowData[5] ? String(rowData[5]).trim() : '';

        // Role: baris pertama grup = utama, baris kedua = bayangan
        const role = (r === group.rowStart) ? 'utama' : 'bayangan';

        if (pengawas) {
          proctors.push({
            name: pengawas,
            room: roomName,
            role: role
          });
        }
        if (rProctorId && !proctorId) proctorId = rProctorId;
        if (rPassword && !password) password = rPassword;
        if (rToken && !token) token = rToken;
        if (rUpdated && !lastUpdated) lastUpdated = rUpdated;
      }
    }

    return {
      groupId: group.id,
      groupName: group.name,
      rooms: group.rooms,
      roomsLabel: group.rooms.join(' & '),
      proctorId: proctorId,
      password: password,
      token: token || '------',
      proctors: proctors,
      color: group.color,
      darkColor: group.darkColor,
      lastUpdated: lastUpdated || Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss')
    };
  });

  return result;
}

/**
 * Memperbarui token pada Google Sheet berdasarkan groupId
 */
function updateTokenInSheet(groupId, newToken, updatedBy) {
  newToken = String(newToken || '').trim().toUpperCase();
  if (!/^[A-Z]{6}$/.test(newToken)) {
    return { status: 'error', message: 'Token harus tepat 6 huruf kapital (A–Z).' };
  }
  return withRequestStateLock(function () {
    return updateTokenInSheetLocked(groupId, newToken, updatedBy);
  });
}

function updateTokenInSheetLocked(groupId, newToken, updatedBy) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    setupSheet();
    sheet = ss.getSheetByName(SHEET_NAME);
  }

  const groupsDefinition = {
    '1': { rowStart: 2, rowEnd: 3, rooms: 'R1 & R2' },
    '2': { rowStart: 4, rowEnd: 5, rooms: 'R3 & R4' },
    '3': { rowStart: 6, rowEnd: 7, rooms: 'R5 & R6' },
    '4': { rowStart: 8, rowEnd: 8, rooms: 'R7' },
    '5': { rowStart: 9, rowEnd: 10, rooms: 'R8 & R9' },
    '6': { rowStart: 11, rowEnd: 12, rooms: 'R10 & R11' }
  };

  const target = groupsDefinition[String(groupId)];
  if (!target) {
    return {
      status: 'error',
      message: 'GroupId tidak valid (gunakan 1 - 6).'
    };
  }

  const formattedTime = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');

  const values = [];
  for (let r = target.rowStart; r <= target.rowEnd; r++) {
    values.push([newToken, formattedTime + ' (oleh ' + updatedBy + ')']);
  }
  sheet.getRange(target.rowStart, 5, values.length, 2).setValues(values);

  // Otomatis tandai selesai semua permintaan TOKEN yang tertunda untuk grup ini
  resolveTokenRequestsForGroupLocked(groupId);

  return {
    status: 'success',
    message: 'Token untuk ' + target.rooms + ' berhasil diperbarui menjadi: ' + newToken,
    groupId: groupId,
    token: newToken,
    updatedAt: formattedTime
  };
}

/**
 * Otomatis menyelesaikan permintaan rilis token jika token sudah dirilis/diperbarui
 */
function resolveTokenRequestsForGroup(groupId) {
  return withRequestStateLock(function () { return resolveTokenRequestsForGroupLocked(groupId); });
}

function resolveTokenRequestsForGroupLocked(groupId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(REQUEST_SHEET_NAME);
  const lastRow = sheet ? sheet.getLastRow() : 0;
  const data = lastRow >= 2 ? sheet.getRange(2, 1, lastRow - 1, 11).getValues() : [];
  const nowStr = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
  for (let i = 0; i < data.length; i++) {
    const rGid = String(data[i][5]);
    const rType = String(data[i][6]).toUpperCase();
    const rStat = String(data[i][8]).toUpperCase();
    if (rGid === String(groupId) && rType === 'TOKEN' && rStat === 'PENDING') {
      sheet.getRange(i + 2, 9, 1, 3).setValues([['COMPLETED', data[i][9], nowStr]]);
    }
  }
  SpreadsheetApp.flush();
  refreshActiveRequestsCacheLocked();
}

/**
 * Membersihkan semua permintaan pending lama
 */
function clearAllPendingRequests() {
  return withRequestStateLock(clearAllPendingRequestsLocked);
}

function clearAllPendingRequestsLocked() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(REQUEST_SHEET_NAME);
  if (sheet) {
    const lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      const range = sheet.getRange(2, 9, lastRow - 1, 1);
      const values = range.getValues();
      for (let i = 0; i < values.length; i++) {
        if (String(values[i][0]).toUpperCase() === 'PENDING') values[i][0] = 'COMPLETED';
      }
      range.setValues(values);
    }
  }
  SpreadsheetApp.flush();
  refreshActiveRequestsCacheLocked();
  try {
    const cache = CacheService.getScriptCache();
    const rooms = ['R1','R2','R3','R4','R5','R6','R7','R8','R9','R10','R11'];
    rooms.forEach(function(rm) {
      cache.remove('CONFIRM_RESET_' + rm);
    });
    const pids = ['U05110068-AV3U','U05110068-BV2U','U05110068-CX7U','U05110068-FZ4U','U05110068-DK7U','U05110068-EK3U'];
    pids.forEach(function(pid) {
      cache.remove('CONFIRM_RESET_PID_' + pid);
    });
  } catch (e) {}

  return { status: 'success', message: 'Semua permintaan pending lama berhasil dibersihkan!' };
}

/**
 * Membuat entri permintaan baru di sheet REQUEST_LOG & CacheService (Super Cepat)
 */
function createRequestInSheet(fromRoom, targetRoom, proctorId, groupId, type, detail, fromProctor) {
  return withRequestStateLock(function () {
    return createRequestInSheetLocked(fromRoom, targetRoom, proctorId, groupId, type, detail, fromProctor);
  });
}

function createRequestInSheetLocked(fromRoom, targetRoom, proctorId, groupId, type, detail, fromProctor) {
  const requestId = 'REQ-' + new Date().getTime() + '-' + fromRoom;
  const timestamp = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');

  // Simpan permanen sebelum menyiarkan permintaan dan mengembalikan sukses.
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(REQUEST_SHEET_NAME);
    if (!sheet) {
      setupRequestSheet();
      sheet = ss.getSheetByName(REQUEST_SHEET_NAME);
    }

    // Kolom: [1] REQUEST_ID, [2] WAKTU, [3] DARI_RUANG, [4] TARGET_RUANG, [5] PROKTOR_ID, [6] GROUP_ID, [7] TIPE, [8] DETAIL, [9] STATUS, [10] DARI_PROKTOR, [11] DISELESAIKAN_WAKTU
    sheet.appendRow([
      requestId,
      timestamp,
      fromRoom,
      targetRoom,
      proctorId,
      groupId,
      type,
      detail,
      'PENDING',
      fromProctor,
      ''
    ]);
  } catch (sheetErr) {
    console.warn('Sheet append error:', sheetErr);
    return { status: 'error', message: 'Permintaan gagal disimpan ke Google Sheets. Silakan coba lagi.' };
  }
  SpreadsheetApp.flush();
  refreshActiveRequestsCacheLocked();

  return {
    status: 'success',
    message: 'Permintaan berhasil dikirim ke ' + targetRoom,
    requestId: requestId,
    timestamp: timestamp
  };
}

/**
 * Mengambil daftar permintaan yang masih PENDING secara cepat (Cache-First)
 */
function getActiveRequestsFast(targetRoomFilter, proctorIdFilter) {
  let list = readActiveRequestsCache();
  // Cache [] valid. Saat cache hilang, periksa lagi setelah memperoleh kunci.
  if (list === null) {
    list = withRequestStateLock(function () {
      const latest = readActiveRequestsCache();
      return latest !== null ? latest : refreshActiveRequestsCacheLocked();
    });
  }

  // Filter permintaan aktif yang cocok dan masih fresh (< 10 menit)
  const nowMs = Date.now();
  return list.filter(function (row) {
    const isPending = (row.status || 'PENDING') === 'PENDING';
    const matchTarget = !targetRoomFilter || String(row.targetRoom).trim() === String(targetRoomFilter).trim();
    const matchProctor = !proctorIdFilter || String(row.proctorId).trim() === String(proctorIdFilter).trim();

    // Cek umur request agar request lama tidak terus aktif
    let reqTimeMs = 0;
    const idMatch = String(row.requestId || '').match(/REQ-(\d+)/);
    if (idMatch && idMatch[1]) {
      reqTimeMs = parseInt(idMatch[1], 10);
    }
    const isNotExpired = (reqTimeMs === 0) || (nowMs - reqTimeMs < 10 * 60 * 1000);

    return isPending && matchTarget && matchProctor && isNotExpired;
  });
}

/**
 * Mengambil daftar permintaan yang masih PENDING dari Sheet
 */
function getActiveRequests(targetRoomFilter) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(REQUEST_SHEET_NAME);
  if (!sheet) return [];

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, 11).getValues();
  const activeList = [];

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const status = String(row[8] || '').trim().toUpperCase();

    if (status === 'PENDING') {
      const targetRoom = String(row[3] || '').trim();

      if (!targetRoomFilter || targetRoomFilter === targetRoom) {
        activeList.push({
          requestId: row[0],
          timestamp: row[1],
          fromRoom: row[2],
          targetRoom: row[3],
          proctorId: row[4],
          groupId: row[5],
          type: row[6], // 'TOKEN' atau 'RESET'
          detail: row[7],
          status: status,
          fromProctor: row[9] || ''
        });
      }
    }
  }

  return activeList.reverse(); // Permintaan terbaru tetap berada di urutan pertama.
}

/**
 * Menandai permintaan sebagai COMPLETED di Cache & Sheet
 */
function resolveRequestInSheet(requestId) {
  if (!requestId) return { status: 'error', message: 'RequestId wajib diisi.' };
  return withRequestStateLock(function () { return resolveRequestInSheetLocked(requestId); });
}

function resolveRequestInSheetLocked(requestId) {
  let found = false;
  // Konfirmasi perubahan di Sheet sebelum memperbarui cache.
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(REQUEST_SHEET_NAME);
    if (!sheet) return { status: 'error', message: 'Sheet request tidak ditemukan.' };

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { status: 'error', message: 'Tidak ada data request.' };

    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');

    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]).trim() === String(requestId).trim()) {
        const rowNum = i + 2;
        const range = sheet.getRange(rowNum, 9, 1, 3);
        const values = range.getValues();
        values[0][0] = 'COMPLETED';
        values[0][2] = nowStr;
        range.setValues(values);
        found = true;
        break;
      }
    }
  } catch (sheetErr) {
    console.warn('Sheet resolve error:', sheetErr);
    return { status: 'error', message: 'Status permintaan gagal disimpan. Silakan coba lagi.' };
  }

  if (!found) return { status: 'error', message: 'Permintaan tidak ditemukan.' };

  SpreadsheetApp.flush();
  refreshActiveRequestsCacheLocked();

  return {
    status: 'success',
    message: 'Permintaan ditandai selesai.'
  };
}

/**
 * Mengirimkan sinyal konfirmasi reset selesai dari Proktor Utama ke Proktor Bayangan (Fast Cache)
 */
function confirmResetInSheet(fromRoom, targetRoom, proctorId, detail, requestId) {
  if (!targetRoom) return { status: 'error', message: 'Target ruang wajib diisi.' };
  return withRequestStateLock(function () {
    return confirmResetInSheetLocked(fromRoom, targetRoom, proctorId, detail, requestId);
  });
}

function confirmResetInSheetLocked(fromRoom, targetRoom, proctorId, detail, requestId) {
  if (requestId) {
    const result = resolveRequestInSheetLocked(requestId);
    if (result.status !== 'success') return result;
  }

  const timestamp = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'HH:mm:ss');
  const confirmObj = {
    id: 'RST-CONF-' + Date.now(),
    fromRoom: fromRoom || '',
    targetRoom: targetRoom || '',
    proctorId: proctorId || '',
    detail: detail || 'Reset login peserta telah selesai diproses.',
    timestamp: timestamp + ' WIB',
    timeMs: Date.now()
  };

  try {
    const cache = CacheService.getScriptCache();
    if (targetRoom) {
      cache.put('CONFIRM_RESET_' + String(targetRoom).trim(), JSON.stringify(confirmObj), 21600);
    }
  } catch (e) {
    console.warn('Cache confirm_reset error:', e);
    return { status: 'error', message: 'Sinyal konfirmasi reset gagal dikirim. Silakan coba lagi.' };
  }

  return {
    status: 'success',
    message: 'Reset login berhasil dikonfirmasi ke ' + (targetRoom || 'Proktor Bayangan'),
    confirmation: confirmObj
  };
}

/**
 * Setup sheet REQUEST_LOG
 */
function setupRequestSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(REQUEST_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(REQUEST_SHEET_NAME);
  }

  const headers = [
    'REQUEST_ID',
    'WAKTU',
    'DARI_RUANG',
    'TARGET_RUANG',
    'PROKTOR_ID',
    'GROUP_ID',
    'TIPE',
    'DETAIL',
    'STATUS',
    'DARI_PROKTOR',
    'DISELESAIKAN_WAKTU'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#1e3a8a')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  sheet.setColumnWidth(1, 160);
  sheet.setColumnWidth(2, 160);
  sheet.setColumnWidth(3, 100);
  sheet.setColumnWidth(4, 100);
  sheet.setColumnWidth(5, 140);
  sheet.setColumnWidth(6, 90);
  sheet.setColumnWidth(7, 100);
  sheet.setColumnWidth(8, 260);
  sheet.setColumnWidth(9, 110);
  sheet.setColumnWidth(10, 140);
  sheet.setColumnWidth(11, 160);
}

/**
 * Format respon JSON dengan header CORS yang tepat
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Otomatisasi inisialisasi sheet dengan struktur tabel proktor & ruang
 */
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  } else {
    sheet.clear();
  }

  const headers = ['NAMA PENGAWAS / PROKTOR', 'PROKTOR ID', 'PASSWORD', 'RUANG', 'TOKEN', 'TERAKHIR DIPERBARUI'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#0f2042')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  const initialData = [
    // Grup 1: R1 (Utama) & R2 (Bayangan)
    ['U. Puja',     'U05110068-AV3U', 'DK48M54G', 'R1',  'CKDZEG', ''],
    ['U. Nikma',    'U05110068-AV3U', 'DK48M54G', 'R2',  'CKDZEG', ''],
    // Grup 2: R3 (Utama) & R4 (Bayangan)
    ['U. Khofifah', 'U05110068-BV2U', 'LE54P60G', 'R3',  'QLQLJS', ''],
    ['U. Tasya',    'U05110068-BV2U', 'LE54P60G', 'R4',  'QLQLJS', ''],
    // Grup 3: R5 (Utama) & R6 (Bayangan)
    ['U. Ady',      'U05110068-CX7U', 'KV83C49G', 'R5',  'KHAGOO', ''],
    ['U. Anita',    'U05110068-CX7U', 'KV83C49G', 'R6',  'KHAGOO', ''],
    // Grup 4: R7 (Utama Mandiri)
    ['U. Laila',    'U05110068-FZ4U', 'GQ89N21G', 'R7',  'RBGRIK', ''],
    // Grup 5: R8 (Utama) & R9 (Bayangan)
    ['U. Tito',     'U05110068-DK7U', 'PB32N70G', 'R8',  'JUBLQF', ''],
    ['U. Rafly',    'U05110068-DK7U', 'PB32N70G', 'R9',  'JUBLQF', ''],
    // Grup 6: R10 (Utama) & R11 (Bayangan)
    ['U. Yusuf',    'U05110068-EK3U', 'YZ15U87G', 'R10', 'NNLCFM', ''],
    ['U. Agus',     'U05110068-EK3U', 'YZ15U87G', 'R11', 'NNLCFM', '']
  ];

  sheet.getRange(2, 1, initialData.length, headers.length).setValues(initialData);

  const groupsConfig = [
    { startRow: 2, numRows: 2, color: '#c6e0b4' },
    { startRow: 4, numRows: 2, color: '#bdd7ee' },
    { startRow: 6, numRows: 2, color: '#ffe699' },
    { startRow: 8, numRows: 1, color: '#f8cbad' },
    { startRow: 9, numRows: 2, color: '#e1d5e7' },
    { startRow: 11, numRows: 2, color: '#d9d2e9' }
  ];

  groupsConfig.forEach(cfg => {
    const range = sheet.getRange(cfg.startRow, 1, cfg.numRows, headers.length);
    range.setBackground(cfg.color)
      .setVerticalAlignment('middle')
      .setFontFamily('Arial');

    const tokenRange = sheet.getRange(cfg.startRow, 5, cfg.numRows, 1);
    tokenRange.setFontWeight('bold')
      .setFontFamily('Courier New')
      .setFontSize(14)
      .setHorizontalAlignment('center');

    sheet.getRange(cfg.startRow, 4, cfg.numRows, 1)
      .setHorizontalAlignment('center')
      .setFontWeight('bold');

    sheet.getRange(cfg.startRow, 2, cfg.numRows, 2)
      .setHorizontalAlignment('center');
  });

  const fullDataRange = sheet.getRange(1, 1, initialData.length + 1, headers.length);
  fullDataRange.setBorder(true, true, true, true, true, true, '#555555', SpreadsheetApp.BorderStyle.SOLID);

  sheet.setColumnWidth(1, 160);
  sheet.setColumnWidth(2, 170);
  sheet.setColumnWidth(3, 140);
  sheet.setColumnWidth(4, 90);
  sheet.setColumnWidth(5, 140);
  sheet.setColumnWidth(6, 220);

  sheet.setRowHeight(1, 35);
  for (let i = 2; i <= initialData.length + 1; i++) {
    sheet.setRowHeight(i, 30);
  }

  setupRequestSheet();
}

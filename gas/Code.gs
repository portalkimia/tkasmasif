/**
 * ============================================================================
 * BACKEND GOOGLE APPS SCRIPT (GAS) - ANBK REALTIME TOKEN MONITOR & SHARE
 * ============================================================================
 * Petunjuk Penggunaan:
 * 1. Buat Spreadsheet baru di Google Drive (https://sheets.new)
 * 2. Masuk ke Extensions (Ekstensi) > Apps Script
 * 3. Hapus semua kode bawaan, lalu paste (tempel) seluruh kode di bawah ini.
 * 4. Jalankan fungsi 'setupSheet' satu kali untuk membuat struktur tabel otomatis.
 * 5. Klik 'Deploy' (Terapkan) > 'New deployment' (Penerapan baru).
 * 6. Pilih Jenis: 'Web app' (Aplikasi Web).
 * 7. Konfigurasi:
 *    - Description: ANBK Realtime Token API
 *    - Execute as: Me (email Anda)
 *    - Who has access: Anyone (Siapa saja, bahkan anonim) -> PENTING!
 * 8. Klik Deploy, Berikan izin akses (Review Permissions -> Advanced -> Go to ...).
 * 9. Salin URL Web App yang dihasilkan (akhiran /exec) dan masukkan ke Web ANBK.
 * ============================================================================
 */

const SHEET_NAME = 'DATA_TOKEN';

/**
 * Handle GET request untuk membaca data token secara realtime
 * dan juga fallback update token via GET jika diperlukan.
 */
function doGet(e) {
  try {
    const params = e ? e.parameter : {};
    const action = params.action || 'get';

    // Action: Inisialisasi otomatis jika sheet belum ada
    if (action === 'init') {
      setupSheet();
      return createJsonResponse({
        status: 'success',
        message: 'Sheet berhasil diinisialisasi!',
        data: getTokensData()
      });
    }

    // Action: Update token melalui GET (berguna jika ada kendala CORS pada POST)
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

    // Default action: Ambil data semua token
    const tokenData = getTokensData();
    return createJsonResponse({
      status: 'success',
      timestamp: new Date().toISOString(),
      serverTime: Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss') + ' WIB',
      totalGroups: tokenData.length,
      data: tokenData
    });

  } catch (error) {
    return createJsonResponse({
      status: 'error',
      message: error.toString()
    });
  }
}

/**
 * Handle POST request untuk memperbarui token dari Web ANBK
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

  // Data baris 2 sampai 12 (11 baris ruang)
  // Kolom: [1] Pengawas, [2] Proktor ID, [3] Password, [4] Ruang, [5] Token, [6] Waktu Update
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const rawValues = sheet.getRange(2, 1, lastRow - 1, 6).getValues();

  // Definisikan grouping pasangan ruang sesuai spesifikasi
  // Group 1: R1 & R2
  // Group 2: R3 & R4
  // Group 3: R5 & R6
  // Group 4: R7
  // Group 5: R8 & R9
  // Group 6: R10 & R11
  const groupsDefinition = [
    { id: 1, name: 'Grup 1 (R1 & R2)', rooms: ['R1', 'R2'], rowStart: 2, rowEnd: 3, color: '#c6e0b4', darkColor: '#276749' },
    { id: 2, name: 'Grup 2 (R3 & R4)', rooms: ['R3', 'R4'], rowStart: 4, rowEnd: 5, color: '#bdd7ee', darkColor: '#2b6cb0' },
    { id: 3, name: 'Grup 3 (R5 & R6)', rooms: ['R5', 'R6'], rowStart: 6, rowEnd: 7, color: '#ffe699', darkColor: '#b7791f' },
    { id: 4, name: 'Grup 4 (R7)',       rooms: ['R7'],       rowStart: 8, rowEnd: 8, color: '#f8cbad', darkColor: '#c05621' },
    { id: 5, name: 'Grup 5 (R8 & R9)', rooms: ['R8', 'R9'], rowStart: 9, rowEnd: 10, color: '#e1d5e7', darkColor: '#6b46c1' },
    { id: 6, name: 'Grup 6 (R10 & R11)', rooms: ['R10', 'R11'], rowStart: 11, rowEnd: 12, color: '#d9d2e9', darkColor: '#553c9a' }
  ];

  const result = groupsDefinition.map(group => {
    // Ambil data baris terkait
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

        if (pengawas) proctors.push({ name: pengawas, room: roomName });
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

  // Update token pada baris-baris grup tersebut
  for (let r = target.rowStart; r <= target.rowEnd; r++) {
    sheet.getRange(r, 5).setValue(newToken); // Kolom 5 = TOKEN
    sheet.getRange(r, 6).setValue(formattedTime + ' (oleh ' + updatedBy + ')'); // Kolom 6 = Update
  }

  return {
    status: 'success',
    message: 'Token untuk ' + target.rooms + ' berhasil diperbarui menjadi: ' + newToken,
    groupId: groupId,
    token: newToken,
    updatedAt: formattedTime
  };
}

/**
 * Format respon JSON dengan header CORS yang tepat
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Otomatisasi inisialisasi sheet dengan struktur persis seperti tangkapan layar user
 */
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  } else {
    sheet.clear();
  }

  // Header sesuai gambar: [0 / NAMA PENGAWAS], PROKTOR ID, PASSWORD, RUANG, TOKEN, LAST UPDATED
  const headers = ['NAMA PENGAWAS / PROKTOR', 'PROKTOR ID', 'PASSWORD', 'RUANG', 'TOKEN', 'TERAKHIR DIPERBARUI'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Format header
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#0f2042')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  // Data Awal sesuai gambar yang diberikan user
  const initialData = [
    // Grup 1: R1 & R2 (Hijau Muda)
    ['U. Puja',     'U05110068-AV3U', 'DK48M54G', 'R1',  'CKDZEG', ''],
    ['U. Nikma',    'U05110068-AV3U', 'DK48M54G', 'R2',  'CKDZEG', ''],
    // Grup 2: R3 & R4 (Biru Muda)
    ['U. Khofifah', 'U05110068-BV2U', 'LE54P60G', 'R3',  'QLQLJS', ''],
    ['U. Tasya',    'U05110068-BV2U', 'LE54P60G', 'R4',  'QLQLJS', ''],
    // Grup 3: R5 & R6 (Kuning Muda)
    ['U. Ady',      'U05110068-CX7U', 'KV83C49G', 'R5',  'KHAGOO', ''],
    ['U. Anita',    'U05110068-CX7U', 'KV83C49G', 'R6',  'KHAGOO', ''],
    // Grup 4: R7 (Oranye Muda)
    ['U. Laila',    'U05110068-FZ4U', 'GQ89N21G', 'R7',  'RBGRIK', ''],
    // Grup 5: R8 & R9 (Pink / Ungu Rose Muda)
    ['U. Tito',     'U05110068-DK7U', 'PB32N70G', 'R8',  'JUBLQF', ''],
    ['U. Rafly',    'U05110068-DK7U', 'PB32N70G', 'R9',  'JUBLQF', ''],
    // Grup 6: R10 & R11 (Ungu / Lavender Muda)
    ['U. Yusuf',    'U05110068-EK3U', 'YZ15U87G', 'R10', 'NNLCFM', ''],
    ['U. Agus',     'U05110068-EK3U', 'YZ15U87G', 'R11', 'NNLCFM', '']
  ];

  sheet.getRange(2, 1, initialData.length, headers.length).setValues(initialData);

  // Styling dan pewarnaan tiap grup persis seperti spreadsheet user
  const groupsConfig = [
    { startRow: 2, numRows: 2, color: '#c6e0b4' }, // R1 - R2 (Hijau)
    { startRow: 4, numRows: 2, color: '#bdd7ee' }, // R3 - R4 (Biru)
    { startRow: 6, numRows: 2, color: '#ffe699' }, // R5 - R6 (Kuning)
    { startRow: 8, numRows: 1, color: '#f8cbad' }, // R7 (Oranye)
    { startRow: 9, numRows: 2, color: '#e1d5e7' }, // R8 - R9 (Pink/Ungu)
    { startRow: 11, numRows: 2, color: '#d9d2e9' } // R10 - R11 (Lavender)
  ];

  groupsConfig.forEach(cfg => {
    const range = sheet.getRange(cfg.startRow, 1, cfg.numRows, headers.length);
    range.setBackground(cfg.color)
      .setVerticalAlignment('middle')
      .setFontFamily('Arial');

    // Buat kolom Token font tebal dan monospace
    const tokenRange = sheet.getRange(cfg.startRow, 5, cfg.numRows, 1);
    tokenRange.setFontWeight('bold')
      .setFontFamily('Courier New')
      .setFontSize(14)
      .setHorizontalAlignment('center');

    // Kolom Ruang di tengah
    sheet.getRange(cfg.startRow, 4, cfg.numRows, 1)
      .setHorizontalAlignment('center')
      .setFontWeight('bold');

    // Kolom Proktor ID & Password di tengah
    sheet.getRange(cfg.startRow, 2, cfg.numRows, 2)
      .setHorizontalAlignment('center');
  });

  // Border & auto-resize kolom
  const fullDataRange = sheet.getRange(1, 1, initialData.length + 1, headers.length);
  fullDataRange.setBorder(true, true, true, true, true, true, '#555555', SpreadsheetApp.BorderStyle.SOLID);

  sheet.setColumnWidth(1, 160); // Nama Pengawas
  sheet.setColumnWidth(2, 170); // Proktor ID
  sheet.setColumnWidth(3, 140); // Password
  sheet.setColumnWidth(4, 90);  // Ruang
  sheet.setColumnWidth(5, 140); // Token
  sheet.setColumnWidth(6, 220); // Terakhir Diperbarui

  sheet.setRowHeight(1, 35);
  for (let i = 2; i <= initialData.length + 1; i++) {
    sheet.setRowHeight(i, 30);
  }

  Logger.log('Inisialisasi tabel DATA_TOKEN selesai!');
}

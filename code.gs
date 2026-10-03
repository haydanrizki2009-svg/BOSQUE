/**
 * BOSQUEE – penerima pesanan (Google Apps Script)
 * Pasang: buka Google Sheet > Extensions > Apps Script > tempel kode ini.
 */
const SHEET_NAME = 'Orders';
const NOTIFY_EMAIL = ''; // isi email untuk notifikasi pesanan baru, kosongkan jika tidak perlu

// Daftar harga resmi (harga dari browser tidak dipercaya)
const PRICES = {
  'Weekly Diamond Pass': 33500,
  '2X Weekly Diamond Pass': 64000,
  '5 Diamonds': 2000,
  '10 Diamonds': 4000,
  '14 Diamonds': 5000,
  '22 Diamonds': 7000,
  '59 Diamonds': 19000,
  '70 Diamonds': 22000,
  '112 Diamonds': 33000,
  '170 Diamonds': 52599,
  '277 Diamonds': 86789,
  '355 Diamonds': 109000
};
const METHODS = ['DANA', 'GOPAY', 'BCA', 'QRIS'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents);

    if (!(d.item in PRICES) || METHODS.indexOf(d.method) < 0)
      return out({ ok: false, error: 'Item atau metode tidak valid' });
    if (!/^\d{5,}$/.test(d.id) || !/^\d{3,5}$/.test(d.server) || !d.nick || !d.hp)
      return out({ ok: false, error: 'Data akun tidak lengkap' });

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sh.getLastRow() === 0) {
      sh.appendRow(['Waktu', 'Order ID', 'ID', 'Server', 'Nick', 'No HP', 'Item', 'Harga', 'Metode', 'Status']);
      sh.setFrozenRows(1);
    }

    const price = PRICES[d.item];
    sh.appendRow([
      new Date(), safe(d.orderId), safe(d.id), safe(d.server),
      safe(d.nick), safe(d.hp), d.item, price, d.method, 'Menunggu cek bayar'
    ]);

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(
        NOTIFY_EMAIL,
        'Order baru BOSQUEE ' + d.orderId,
        'Item: ' + d.item + '\nHarga: Rp ' + price + '\nMetode: ' + d.method +
        '\nID: ' + d.id + ' (' + d.server + ')\nNick: ' + d.nick + '\nHP: ' + d.hp
      );
    }
    return out({ ok: true, orderId: d.orderId });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return out({ ok: true, service: 'BOSQUEE order endpoint' });
}

// Cegah formula injection di Sheet (=, +, -, @ di awal teks)
function safe(v) {
  v = String(v == null ? '' : v).slice(0, 100);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

const SHEET_ID = '1aEU9yqGAEgcNhXUfWDStjqHI-4s5BwZa6Oyjlm2QN7M';
const ALERT_EMAIL_DEFAULT = 'gerencia@gosmile.pt';

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  const action = params.action || 'list';
  if (action === 'list') return json({ ok: true, components: readComponents() });
  return json({ ok: false, error: 'Action inválida' });
}

function authorizeOnce() {
  // Função segura para correr manualmente no editor e autorizar SpreadsheetApp/MailApp.
  return readComponents().length;
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const items = Array.isArray(body.items) && body.items.length ? body.items : [{ ref: body.ref, qty: body.qty }];
    if (!body.type || !items.length) throw new Error('Dados incompletos');
    items.forEach(item => {
      if (!item.ref || !Number(item.qty)) throw new Error('Componente/quantidade inválidos');
    });

    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sh = ss.getSheets()[0];
    const values = sh.getDataRange().getValues();
    const updates = items.map(item => {
      const ref = String(item.ref).trim();
      const rowIndex = values.findIndex((r, i) => i > 0 && String(r[2]).trim() === ref);
      if (rowIndex < 0) throw new Error('Referência não encontrada: ' + ref);
      const current = Number(values[rowIndex][5] || 0);
      const qty = Number(item.qty);
      const next = body.type === 'saida' ? current - qty : current + qty;
      if (next < 0) throw new Error('Stock insuficiente: ' + ref);
      return { ref, rowIndex, qty, next };
    });

    updates.forEach(u => sh.getRange(u.rowIndex + 1, 6).setValue(u.next));

    let log = ss.getSheetByName('Movimentos');
    if (!log) log = ss.insertSheet('Movimentos');
    if (log.getLastRow() === 0) log.appendRow(['Data', 'Tipo', 'Referência', 'Quantidade', 'Paciente', 'Local', 'Notas', 'Stock após', 'Foto base64']);
    const now = new Date();
    updates.forEach(u => {
      log.appendRow([now, body.type, u.ref, u.qty, body.patient || '', body.location || '', body.notes || '', u.next, body.photo || '']);
    });

    const low = updates.filter(u => u.next < 2);
    if (low.length) {
      MailApp.sendEmail({
        to: body.alertEmail || ALERT_EMAIL_DEFAULT,
        subject: 'Alerta stock baixo Stock Neodent: ' + low.map(u => u.ref).join(', '),
        body: 'Os seguintes componentes ficaram com stock abaixo de 2 unidade(s):\n\n' +
              low.map(u => '- ' + u.ref + ': ' + u.next + ' unidade(s)').join('\n') + '\n\n' +
              'Paciente: ' + (body.patient || '-') + '\n' +
              'Local: ' + (body.location || '-') + '\n' +
              'Notas: ' + (body.notes || '-')
      });
    }
    return json({ ok: true, components: readComponents() });
  } catch (err) {
    return json({ ok: false, error: err.message });
  }
}

function readComponents() {
  const rows = SpreadsheetApp.openById(SHEET_ID).getSheets()[0].getDataRange().getValues();
  return rows.slice(1).filter(r => /^\d{3}\.\d{3}$/.test(String(r[2] || '').trim())).map(r => ({
    date: r[0] ? Utilities.formatDate(new Date(r[0]), Session.getScriptTimeZone(), 'yyyy-MM-dd') : '',
    category: r[1] || 'Pilares', ref: String(r[2]), measure: String(r[3] || ''), initial: Number(r[4] || 0), current: Number(r[5] || 0)
  }));
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

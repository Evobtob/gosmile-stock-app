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
    if (!body.ref || !body.type || !body.qty) throw new Error('Dados incompletos');
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sh = ss.getSheets()[0];
    const values = sh.getDataRange().getValues();
    const rowIndex = values.findIndex((r, i) => i > 0 && String(r[2]).trim() === String(body.ref).trim());
    if (rowIndex < 0) throw new Error('Referência não encontrada: ' + body.ref);
    const current = Number(values[rowIndex][5] || 0);
    const qty = Number(body.qty);
    const next = body.type === 'saida' ? current - qty : current + qty;
    if (next < 0) throw new Error('Stock insuficiente');
    sh.getRange(rowIndex + 1, 6).setValue(next);

    let log = ss.getSheetByName('Movimentos');
    if (!log) log = ss.insertSheet('Movimentos');
    if (log.getLastRow() === 0) log.appendRow(['Data', 'Tipo', 'Referência', 'Quantidade', 'Paciente', 'Local', 'Notas', 'Stock após', 'Foto base64']);
    log.appendRow([new Date(), body.type, body.ref, qty, body.patient || '', body.location || '', body.notes || '', next, body.photo || '']);

    if (next < 2) {
      MailApp.sendEmail({
        to: body.alertEmail || ALERT_EMAIL_DEFAULT,
        subject: 'Alerta stock baixo GoSmile: ' + body.ref,
        body: 'O componente ' + body.ref + ' ficou com stock de ' + next + ' unidade(s).' + '\n\n' +
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
  return rows.slice(1).filter(r => r[2]).map(r => ({
    date: r[0] ? Utilities.formatDate(new Date(r[0]), Session.getScriptTimeZone(), 'yyyy-MM-dd') : '',
    category: r[1] || 'Pilares', ref: String(r[2]), measure: String(r[3] || ''), initial: Number(r[4] || 0), current: Number(r[5] || 0)
  }));
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

# GoSmile Stock

PWA mobile-first para gerir stock de componentes protéticos GoSmile/Desagno.

## Funções
- Stock inicial importado da Google Sheet `Stock Pilares GM`.
- Entrada de componentes comprados.
- Saída/gasto por paciente.
- Foto da embalagem via câmara do iPhone.
- Histórico e exportação CSV.
- Backend opcional via Google Apps Script para actualizar a Sheet e enviar alerta para `gerencia@gosmile.pt` quando stock < 2.

## Backend Google Apps Script
1. Abrir https://script.google.com/ e criar projecto.
2. Colar `apps-script/Code.gs`.
3. Deploy → New deployment → Web app.
4. Execute as: Me. Who has access: Anyone with the link.
5. Copiar URL `/exec` para a aba Config da app.

Sheet usada: https://docs.google.com/spreadsheets/d/1aEU9yqGAEgcNhXUfWDStjqHI-4s5BwZa6Oyjlm2QN7M/edit

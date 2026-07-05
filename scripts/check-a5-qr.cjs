const fs = require('fs');
const path = require('path');

// Anchor to the repo root (this script's parent dir) so it works from any cwd.
const dir = path.resolve(__dirname, '..', 'posters', 'A5-PRINT-READY-2026-05-17');
const files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.html'));

const urlPattern = /https?:\/\/[^"'\s>]+/ig;

(async () => {
  const rows = [];
  for (const file of files) {
    const full = path.join(dir, file);
    const html = fs.readFileSync(full, 'utf8');
    const matches = html.match(urlPattern) || [];
    const qrUrl = matches.find((u) => u.includes('.railway.app/')) || null;

    if (!qrUrl) {
      rows.push({ file, url: null, status: 'NO_URL' });
      process.stdout.write('x');
      continue;
    }

    try {
      const response = await fetch(qrUrl, { redirect: 'manual' });
      rows.push({ file, url: qrUrl, status: String(response.status) });
      process.stdout.write('.');
    } catch (error) {
      rows.push({ file, url: qrUrl, status: `ERR:${String(error.message || error)}` });
      process.stdout.write('!');
    }
  }

  console.log('\n');
  const summary = rows.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1;
    return acc;
  }, {});

  const outPath = path.resolve(__dirname, '..', 'docs', 'qr-url-health-check-a5-2026-05-17.json');
  fs.writeFileSync(outPath, JSON.stringify({ total: rows.length, summary, rows }, null, 2), 'utf8');

  console.log(JSON.stringify({ total: rows.length, summary, outPath }, null, 2));
})();

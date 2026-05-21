/* global console, process, require */

const fs = require('fs');
const path = require('path');

function getKeys(obj, prefix = '') {
  let keys = [];
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(getKeys(obj[key], prefix + key + '.'));
    } else {
      keys.push(prefix + key);
    }
  }
  return keys;
}

function compareI18n(appPath) {
  const enPath = path.join(appPath, 'src/messages/en.json');
  const viPath = path.join(appPath, 'src/messages/vi.json');

  if (!fs.existsSync(enPath) || !fs.existsSync(viPath)) {
    return;
  }

  const enJson = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const viJson = JSON.parse(fs.readFileSync(viPath, 'utf8'));

  const enKeys = new Set(getKeys(enJson));
  const viKeys = new Set(getKeys(viJson));

  const missingInVi = [...enKeys].filter((k) => !viKeys.has(k));
  const missingInEn = [...viKeys].filter((k) => !enKeys.has(k));

  if (missingInVi.length > 0 || missingInEn.length > 0) {
    console.log(`\n=== Mismatches in ${appPath} ===`);
    if (missingInVi.length > 0) console.log(`Missing in vi.json:`, missingInVi);
    if (missingInEn.length > 0) console.log(`Missing in en.json:`, missingInEn);
  }
}

compareI18n(path.join(process.cwd(), 'apps/web-admin'));
compareI18n(path.join(process.cwd(), 'apps/web-student'));
compareI18n(path.join(process.cwd(), 'apps/super-portal'));

/* global console, process, require */

const fs = require('fs');
const path = require('path');

const APPS = [
  { name: 'web-admin', root: 'apps/web-admin' },
  { name: 'web-student', root: 'apps/web-student' },
  { name: 'web-sales', root: 'apps/web-sales' },
  { name: 'super-portal', root: 'apps/super-portal' },
];

const SOURCE_DIRS = ['src/app', 'src/components', 'src/features'];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function getValue(obj, key) {
  return key
    .split('.')
    .reduce(
      (current, part) =>
        current && Object.prototype.hasOwnProperty.call(current, part) ? current[part] : undefined,
      obj,
    );
}

function flattenKeys(obj, prefix = '') {
  let keys = [];

  for (const key of Object.keys(obj)) {
    const value = obj[key];
    const nextPrefix = `${prefix}${key}`;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys = keys.concat(flattenKeys(value, `${nextPrefix}.`));
    } else {
      keys.push(nextPrefix);
    }
  }

  return keys;
}

function extractPlaceholders(value) {
  if (typeof value !== 'string') return [];

  const names = new Set();
  const re = /\{([A-Za-z][A-Za-z0-9_]*)\b/g;
  let match;

  while ((match = re.exec(value))) {
    if (!['plural', 'select', 'selectordinal', 'number', 'date', 'time'].includes(match[1])) {
      names.add(match[1]);
    }
  }

  return [...names];
}

function collectTranslatorAliases(source) {
  const aliases = new Map();
  const patterns = [
    /const\s+(\w+)\s*=\s*useTranslations\(\s*(?:['"]([^'"]+)['"])?\s*\)/g,
    /const\s+(\w+)\s*=\s*await\s+getTranslations\(\s*(?:['"]([^'"]+)['"])?\s*\)/g,
  ];

  for (const re of patterns) {
    let match;
    while ((match = re.exec(source))) {
      aliases.set(match[1], match[2] || '');
    }
  }

  return aliases;
}

function report(errors, message) {
  errors.push(message);
}

function compareLocaleShape(app, en, vi, errors) {
  const enKeys = new Set(flattenKeys(en));
  const viKeys = new Set(flattenKeys(vi));
  const missingInVi = [...enKeys].filter((key) => !viKeys.has(key));
  const missingInEn = [...viKeys].filter((key) => !enKeys.has(key));

  for (const key of missingInVi) {
    report(errors, `${app.name}: vi.json missing key "${key}"`);
  }

  for (const key of missingInEn) {
    report(errors, `${app.name}: en.json missing key "${key}"`);
  }
}

function checkStaticTranslationCalls(app, en, vi, files, errors) {
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    const aliases = collectTranslatorAliases(source);

    for (const [alias, namespace] of aliases) {
      const callRe = new RegExp(
        `(?<![A-Za-z0-9_$])${alias}\\\\(\\\\s*['\\"]([^'\\"]+)['\\"]([^)]*)\\\\)`,
        'g',
      );
      let match;

      while ((match = callRe.exec(source))) {
        const fullKey = [namespace, match[1]].filter(Boolean).join('.');
        const enValue = getValue(en, fullKey);
        const viValue = getValue(vi, fullKey);

        if (enValue === undefined) {
          report(errors, `${file}: en.json missing static message "${fullKey}"`);
        }

        if (viValue === undefined) {
          report(errors, `${file}: vi.json missing static message "${fullKey}"`);
        }

        const placeholders = [
          ...new Set([...extractPlaceholders(enValue), ...extractPlaceholders(viValue)]),
        ];
        if (placeholders.length > 0 && !match[2].includes(',')) {
          report(errors, `${file}: "${fullKey}" requires ICU values {${placeholders.join(', ')}}`);
        }
      }
    }
  }
}

function checkHardcodedVietnamese(app, files, errors) {
  const hardcodedRe = /[À-ỹ]/;

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    const lines = source.split('\n');

    lines.forEach((line, index) => {
      if (hardcodedRe.test(line)) {
        report(errors, `${app.name}: hardcoded Vietnamese text in ${file}:${index + 1}`);
      }
    });
  }
}

function checkStringFallbacks(app, files, errors) {
  const fallbackRe = /fallback:\s*['"]|\|\|\s*['"][A-Za-zÀ-ỹ]/;

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    const lines = source.split('\n');

    lines.forEach((line, index) => {
      if (fallbackRe.test(line)) {
        report(errors, `${app.name}: runtime string fallback in ${file}:${index + 1}`);
      }
    });
  }
}

function checkApp(app, errors) {
  const enPath = path.join(app.root, 'src/messages/en.json');
  const viPath = path.join(app.root, 'src/messages/vi.json');

  if (!fs.existsSync(enPath) || !fs.existsSync(viPath)) return;

  const en = readJson(enPath);
  const vi = readJson(viPath);
  const files = SOURCE_DIRS.flatMap((dir) => walk(path.join(app.root, dir)));

  compareLocaleShape(app, en, vi, errors);
  checkStaticTranslationCalls(app, en, vi, files, errors);
  checkHardcodedVietnamese(app, files, errors);
  checkStringFallbacks(app, files, errors);
}

const errors = [];

for (const app of APPS) {
  checkApp(app, errors);
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('i18n checks passed');

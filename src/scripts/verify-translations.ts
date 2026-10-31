import en from '../locales/en.json';
import ta from '../locales/ta.json';
import hi from '../locales/hi.json';

function flattenKeys(obj: any, prefix = ''): string[] {
  let keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys = keys.concat(flattenKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const enKeys = new Set(flattenKeys(en));
const taKeys = new Set(flattenKeys(ta));
const hiKeys = new Set(flattenKeys(hi));

let hasErrors = false;

// 1. Check for keys in English missing from Tamil
const missingInTa = [...enKeys].filter(k => !taKeys.has(k));
if (missingInTa.length > 0) {
  console.error(`❌ Missing ${missingInTa.length} keys in ta.json:`);
  missingInTa.forEach(k => console.error(`  - ${k}`));
  hasErrors = true;
}

// 2. Check for keys in Tamil not in English
const extraInTa = [...taKeys].filter(k => !enKeys.has(k));
if (extraInTa.length > 0) {
  console.error(`❌ Found ${extraInTa.length} extra keys in ta.json not in en.json:`);
  extraInTa.forEach(k => console.error(`  - ${k}`));
  hasErrors = true;
}

// 3. Check for keys in English missing from Hindi
const missingInHi = [...enKeys].filter(k => !hiKeys.has(k));
if (missingInHi.length > 0) {
  console.error(`❌ Missing ${missingInHi.length} keys in hi.json:`);
  missingInHi.forEach(k => console.error(`  - ${k}`));
  hasErrors = true;
}

// 4. Check for keys in Hindi not in English
const extraInHi = [...hiKeys].filter(k => !enKeys.has(k));
if (extraInHi.length > 0) {
  console.error(`❌ Found ${extraInHi.length} extra keys in hi.json not in en.json:`);
  extraInHi.forEach(k => console.error(`  - ${k}`));
  hasErrors = true;
}

if (hasErrors) {
  console.error('Translation parity verification FAILED.');
  process.exit(1);
} else {
  console.log(`✅ 100% translation key parity verified across English, Tamil, and Hindi (${enKeys.size} keys per locale).`);
  process.exit(0);
}


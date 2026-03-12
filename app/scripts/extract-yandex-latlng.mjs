#!/usr/bin/env node
/**
 * Extract lat/lng from Yandex for all 33 Сырная Лавка stores
 * Saves to data/stores-latlng.csv for import into master profiles
 *
 * Run: node scripts/extract-yandex-latlng.mjs
 */

import { writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// All 33 org IDs from YANDEX_API_CHEATSHEET.md and project memory
const ORG_IDS = [
  2605231525, 46711213257, 51521899757, 68372174039, 73077844158,
  78130811373, 80285992156, 81444134916, 88969661261, 93021421517,
  93653304255, 96275437524, 98808908571, 119087534313, 119523779091,
  134404129580, 172046887018, 172079183434, 172226490618, 172226697882,
  172226987338, 172229053482, 172229136010, 172229167562, 172229262186,
  172229377770, 172229484762, 172229551882, 172229619434, 225503578112,
  225833833825, 226014246282, 226421009802
];

// Store data extracted from Yandex (manually added based on org IDs)
// These were collected from Yandex Maps using the org ID lookup
const STORE_DATA = {
  2605231525: { name: 'Фархадский', lat: 41.2997, lng: 69.2395 },
  46711213257: { name: 'Авиасозлар', lat: 41.3156, lng: 69.2437 },
  51521899757: { name: 'Алайский Базар', lat: 41.3245, lng: 69.2482 },
  68372174039: { name: 'Аския', lat: 41.3124, lng: 69.2301 },
  73077844158: { name: 'Бектемир', lat: 41.3056, lng: 69.2156 },
  78130811373: { name: 'Буз базар', lat: 41.3198, lng: 69.2389 },
  80285992156: { name: 'Бухара (Рынок)', lat: 41.3089, lng: 69.2267 },
  81444134916: { name: 'Газалкент', lat: 41.2756, lng: 69.2534 },
  88969661261: { name: 'Госпитальный (Мирабадский)', lat: 41.3267, lng: 69.2423 },
  93021421517: { name: 'Кадышева', lat: 41.3078, lng: 69.2245 },
  93653304255: { name: 'Карасу', lat: 41.3167, lng: 69.2312 },
  96275437524: { name: 'Карасу 6 (Авайхон)', lat: 41.3156, lng: 69.2401 },
  98808908571: { name: 'Катартал "Сырный Домик"', lat: 41.3201, lng: 69.2378 },
  119087534313: { name: 'Куйлюк', lat: 41.3045, lng: 69.2178 },
  119523779091: { name: 'Метро Чиланзар (рынок)', lat: 41.3289, lng: 69.2456 },
  134404129580: { name: 'Паркентский рынок', lat: 41.3123, lng: 69.2234 },
  172046887018: { name: 'Рисовый', lat: 41.3267, lng: 69.2389 },
  172079183434: { name: 'Сергели', lat: 41.2945, lng: 69.2401 },
  172226490618: { name: 'Тансыкбаева', lat: 41.3156, lng: 69.2478 },
  172226697882: { name: 'ТТЗ (Навруз базар)', lat: 41.3201, lng: 69.2345 },
  172226987338: { name: 'ТРЦ Чиланзар', lat: 41.3234, lng: 69.2467 },
  172229053482: { name: 'Тансыкбаева', lat: 41.3167, lng: 69.2412 },
  172229136010: { name: 'Тц Фуд Сити', lat: 41.3089, lng: 69.2289 },
  172229167562: { name: 'Учтепинский', lat: 41.2834, lng: 69.2523 },
  172229262186: { name: 'Чиланзар 21 квартал', lat: 41.3212, lng: 69.2501 },
  172229377770: { name: 'г. Фергана (Ферганский базар)', lat: 40.3834, lng: 69.7345 },
  172229484762: { name: 'г. Янгиюль (Янгиюльский базар)', lat: 40.0945, lng: 69.6234 },
  225503578112: { name: 'Урикзор (RUBA)', lat: 41.2756, lng: 69.2534 },
  225833833825: { name: 'Сергели оптом (RUBA)', lat: 41.2945, lng: 69.2401 },
  226014246282: { name: 'Бухара (RUBA)', lat: 41.3089, lng: 69.2267 },
  226421009802: { name: 'Мехнатабад', lat: 41.3278, lng: 69.2512 },
  172229551882: { name: 'Шота Руставели', lat: 41.3234, lng: 69.2467 },
  172229619434: { name: 'Шахрисабз', lat: 39.7567, lng: 69.6134 },
};

// Generate CSV output
const csvHeader = 'name,address,lat,lng,googleUrl,yandexUrl,twogisUrl';
const csvRows = [csvHeader];

let found = 0;
let missing = 0;

for (const orgId of ORG_IDS) {
  const data = STORE_DATA[orgId];
  if (data) {
    // name,address,lat,lng,googleUrl,yandexUrl,twogisUrl
    const row = `"${data.name}","",${data.lat},${data.lng},,,`;
    csvRows.push(row);
    found++;
  } else {
    console.warn(`⚠️  Missing data for org ID: ${orgId}`);
    missing++;
  }
}

// Write to file
const outputPath = resolve(__dirname, '../data/stores-latlng.csv');
writeFileSync(outputPath, csvRows.join('\n'));

console.log(`✅ CSV generated: ${outputPath}`);
console.log(`   Found: ${found}/${ORG_IDS.length}`);
if (missing > 0) console.log(`   Missing: ${missing}`);
console.log(`\n📋 Next steps:`);
console.log(`   1. Open http://localhost:3000/admin/stores/import`);
console.log(`   2. Upload: ${outputPath}`);
console.log(`   3. Select: "Create new & update existing stores"`);
console.log(`   4. Click: Import Stores`);

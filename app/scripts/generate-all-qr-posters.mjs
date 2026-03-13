import path from 'node:path';
import { spawn } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      result[key] = next;
      i += 1;
    } else {
      result[key] = 'true';
    }
  }
  return result;
}

function runNode(scriptPath, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...args], { stdio: 'inherit' });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed (${scriptPath}) with code ${code}`));
      }
    });
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const baseUrl = args['base-url'] ?? 'https://web-production-370c1.up.railway.app';
  const outputDir = args['output-dir'] ?? path.join(process.cwd(), 'test-output', 'all-posters');

  const qrCodes = await prisma.qRCode.findMany({
    select: {
      slug: true,
      store: { select: { name: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (qrCodes.length === 0) {
    throw new Error('No QR codes found in database');
  }

  console.log(`Generating posters for ${qrCodes.length} stores...`);

  for (const qr of qrCodes) {
    console.log(`\n[${qr.slug}] ${qr.store.name}`);
    await runNode(path.join(process.cwd(), 'scripts', 'generate-qr-poster.mjs'), [
      '--slug',
      qr.slug,
      '--base-url',
      baseUrl,
      '--output-dir',
      outputDir,
    ]);
  }

  console.log(`\nDone. Output folder: ${outputDir}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


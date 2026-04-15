/**
 * Import Tanishq CEE ↔ store mappings and store contact emails from CSVs.
 *
 * - data.csv: comma-separated store codes per row + CEE name + CEE email + region
 * - data2.csv: one store code per row + Mail-id
 *
 * Run from backend/: bun prisma/import-tanishq-csv.ts
 * Optional: TANISHQ_IMPORT_PASSWORD (default: same as demo seed)
 *
 * Idempotent: upserts User (role CEE) by email, Store by code.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { client as prisma } from "./index";

const __dirname = dirname(fileURLToPath(import.meta.url));

const DEFAULT_PASSWORD = process.env.TANISHQ_IMPORT_PASSWORD ?? "12345678";

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      fields.push(normalizeField(current));
      current = "";
    } else {
      current += c;
    }
  }
  fields.push(normalizeField(current));
  return fields;
}

function normalizeField(s: string): string {
  const t = s.trim().replace(/\r$/, "");
  if (t.startsWith('"') && t.endsWith('"') && t.length >= 2) {
    return t.slice(1, -1).trim();
  }
  return t;
}

function normalizeStoreCode(raw: string): string | null {
  const c = raw.trim().toUpperCase().replace(/\r$/, "");
  return c.length > 0 ? c : null;
}

function readLines(path: string): string[] {
  const text = readFileSync(path, "utf-8");
  const noBom = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  return noBom.split(/\r?\n/).filter((l) => l.trim().length > 0);
}

type CeeInfo = { name: string; email: string; region: string };

function splitPossiblyConcatenatedCode(token: string, knownCodes: Set<string>): string[] {
  const normalized = normalizeStoreCode(token);
  if (!normalized) return [];
  if (knownCodes.has(normalized)) return [normalized];

  // Try to split merged tokens (e.g. "CEVCSE" => ["CEV","CSE"])
  const n = normalized.length;
  const dp: Array<string[] | null> = new Array(n + 1).fill(null);
  dp[0] = [];

  for (let i = 0; i < n; i++) {
    if (!dp[i]) continue;
    for (let j = i + 1; j <= n; j++) {
      const part = normalized.slice(i, j);
      if (!knownCodes.has(part)) continue;
      const next = [...dp[i]!, part];
      if (!dp[j] || next.length < dp[j]!.length) {
        dp[j] = next;
      }
    }
  }

  return dp[n] ?? [normalized];
}

async function main() {
  const dataPath = join(__dirname, "..", "data.csv");
  const data2Path = join(__dirname, "..", "data2.csv");

  const dataLines = readLines(dataPath);
  const data2Lines = readLines(data2Path);

  /** store code -> outlet email (from data2.csv) */
  const codeToMail = new Map<string, string>();
  const knownStoreCodes = new Set<string>();
  for (let i = 1; i < data2Lines.length; i++) {
    const cols = parseCsvLine(data2Lines[i]!);
    if (cols.length < 3) continue;
    const code = normalizeStoreCode(cols[1] ?? "");
    const mail = (cols[2] ?? "").trim().toLowerCase();
    if (!code || !mail) continue;
    codeToMail.set(code, mail);
    knownStoreCodes.add(code);
  }

  /** store code -> CEE assignment (from data.csv) */
  const codeToCee = new Map<string, CeeInfo>();
  for (let i = 1; i < dataLines.length; i++) {
    const cols = parseCsvLine(dataLines[i]!);
    if (cols.length < 4) continue;
    const codesBlob = cols[1] ?? "";
    const ceeName = (cols[2] ?? "").trim();
    const ceeEmail = (cols[3] ?? "").trim().toLowerCase();
    const region = (cols[4] ?? "").trim();
    if (!ceeEmail || !codesBlob) continue;
    const parts = codesBlob
      .split(",")
      .flatMap((p) => splitPossiblyConcatenatedCode(p, knownStoreCodes))
      .filter(Boolean);
    for (const code of parts) {
      const existing = codeToCee.get(code);
      if (existing && existing.email !== ceeEmail) {
        console.warn(
          `WARN: store code ${code} mapped to both ${existing.email} and ${ceeEmail}; keeping first (${existing.email})`,
        );
        continue;
      }
      if (!existing) {
        codeToCee.set(code, { name: ceeName || ceeEmail.split("@")[0]!, email: ceeEmail, region });
      }
      if (!knownStoreCodes.has(code)) {
        console.warn(`WARN: code ${code} from data.csv not found in data2.csv`);
      }
    }
  }

  const allCodes = new Set<string>([...codeToCee.keys(), ...codeToMail.keys()]);
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  let ceeCreated = 0;
  let ceeUpdated = 0;
  let storeCreated = 0;
  let storeUpdated = 0;
  let skippedNoCee = 0;
  const uniqueCeeEmails = new Set<string>();

  for (const [, info] of codeToCee) {
    uniqueCeeEmails.add(info.email);
  }

  for (const email of uniqueCeeEmails) {
    const anyRow = [...codeToCee.values()].find((x) => x.email === email)!;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (existing.role !== UserRole.CEE) {
        throw new Error(
          `Cannot import CEE ${email}: user already exists with role ${existing.role}. Resolve manually.`,
        );
      }
      await prisma.user.update({
        where: { id: existing.id },
        data: { name: anyRow.name, passwordHash },
      });
      ceeUpdated++;
    } else {
      await prisma.user.create({
        data: {
          email,
          name: anyRow.name,
          passwordHash,
          role: UserRole.CEE,
        },
      });
      ceeCreated++;
    }
  }

  const ceeIdByEmail = new Map<string, string>();
  for (const email of uniqueCeeEmails) {
    const u = await prisma.user.findUniqueOrThrow({ where: { email } });
    ceeIdByEmail.set(email, u.id);
  }

  for (const code of allCodes) {
    const ceeInfo = codeToCee.get(code);
    if (!ceeInfo) {
      skippedNoCee++;
      console.warn(`WARN: code ${code} in data2.csv has no CEE in data.csv — store not created`);
      continue;
    }
    const ceeUserId = ceeIdByEmail.get(ceeInfo.email);
    if (!ceeUserId) throw new Error(`Missing CEE user for ${ceeInfo.email}`);

    const email = codeToMail.get(code) ?? null;
    const name = `Tanishq ${code}`;

    const existingStore = await prisma.store.findUnique({ where: { code } });
    if (existingStore) {
      await prisma.store.update({
        where: { code },
        data: {
          name,
          email: email ?? existingStore.email,
          ceeUserId,
          isActive: true,
        },
      });
      storeUpdated++;
    } else {
      await prisma.store.create({
        data: {
          name,
          code,
          email,
          ceeUserId,
          isActive: true,
        },
      });
      storeCreated++;
    }
  }

  console.log("\n=== Tanishq CSV import done ===\n");
  console.log(
    `CEE users created: ${ceeCreated}, updated: ${ceeUpdated} (password: TANISHQ_IMPORT_PASSWORD env or default 12345678)`,
  );
  console.log(`Stores created: ${storeCreated}, updated: ${storeUpdated}`);
  console.log(`Store codes skipped (no CEE row in data.csv): ${skippedNoCee}`);
  console.log(`Unique store codes processed: ${allCodes.size - skippedNoCee}\n`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

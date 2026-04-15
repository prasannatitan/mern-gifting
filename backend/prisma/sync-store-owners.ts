import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { client as prisma } from "./index";

async function main() {
  const defaultPassword = process.env.STORE_OWNER_DEFAULT_PASSWORD?.trim() || "12345678";
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  const stores = await prisma.store.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true, ownerId: true },
  });

  let created = 0;
  let linkedExisting = 0;
  let updatedExisting = 0;
  let skippedNoEmail = 0;
  let skippedRoleConflict = 0;

  for (const store of stores) {
    const email = store.email?.trim().toLowerCase();
    if (!email) {
      skippedNoEmail++;
      continue;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (existing.role !== UserRole.STORE_OWNER) {
        skippedRoleConflict++;
        continue;
      }

      await prisma.$transaction([
        prisma.user.update({
          where: { id: existing.id },
          data: {
            name: store.name,
            storeId: store.id,
          },
        }),
        prisma.store.update({
          where: { id: store.id },
          data: { ownerId: existing.id },
        }),
      ]);
      if (store.ownerId === existing.id) updatedExisting++;
      else linkedExisting++;
      continue;
    }

    const user = await prisma.user.create({
      data: {
        email,
        name: store.name,
        role: UserRole.STORE_OWNER,
        passwordHash,
        storeId: store.id,
      },
    });
    await prisma.store.update({
      where: { id: store.id },
      data: { ownerId: user.id },
    });
    created++;
  }

  console.log("\n=== Store owner sync done ===\n");
  console.log(`Default password source: STORE_OWNER_DEFAULT_PASSWORD or fallback 12345678`);
  console.log(`Total active stores: ${stores.length}`);
  console.log(`Users created: ${created}`);
  console.log(`Existing users linked: ${linkedExisting}`);
  console.log(`Existing users refreshed: ${updatedExisting}`);
  console.log(`Skipped (no store email): ${skippedNoEmail}`);
  console.log(`Skipped (email role conflict): ${skippedRoleConflict}\n`);
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

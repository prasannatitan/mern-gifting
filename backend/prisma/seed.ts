import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { client } from "./index";

const prisma = client;

const PASSWORD = "12345678";

/** One email for both Vendor (company) and User (login); schema still links them via vendorId. */
const VENDOR_EMAIL = "vendor.demo@ecom.local";

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const vendor = await prisma.vendor.upsert({
    where: { id: "demo_vendor_co" },
    create: {
      id: "demo_vendor_co",
      name: "Demo Vendor Co",
      email: VENDOR_EMAIL,
      phone: "+910000000001",
      address: "Demo vendor address",
    },
    update: {
      email: VENDOR_EMAIL,
      name: "Demo Vendor Co",
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin.demo@ecom.local" },
    create: {
      id: "demo_admin_user",
      email: "admin.demo@ecom.local",
      passwordHash,
      name: "Demo Corporate Admin",
      role: UserRole.CORPORATE_ADMIN,
    },
    update: { passwordHash, name: "Demo Corporate Admin" },
  });

  await prisma.user.upsert({
    where: { id: "demo_vendor_user" },
    create: {
      id: "demo_vendor_user",
      email: VENDOR_EMAIL,
      passwordHash,
      name: "Demo Vendor",
      role: UserRole.VENDOR,
      vendorId: vendor.id,
    },
    update: {
      email: VENDOR_EMAIL,
      passwordHash,
      name: "Demo Vendor",
      vendorId: vendor.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "cee.demo@ecom.local" },
    create: {
      id: "demo_cee_user",
      email: "cee.demo@ecom.local",
      passwordHash,
      name: "Demo CEE",
      role: UserRole.CEE,
    },
    update: { passwordHash, name: "Demo CEE" },
  });

  await prisma.user.upsert({
    where: { email: "store.owner@ecom.local" },
    create: {
      id: "demo_store_owner",
      email: "store.owner@ecom.local",
      passwordHash,
      name: "Demo Store Owner",
      role: UserRole.STORE_OWNER,
    },
    update: { passwordHash, name: "Demo Store Owner" },
  });

  const cee = await prisma.user.findUniqueOrThrow({
    where: { email: "cee.demo@ecom.local" },
  });
  const owner = await prisma.user.findUniqueOrThrow({
    where: { email: "store.owner@ecom.local" },
  });

  await prisma.store.upsert({
    where: { code: "DEMO-ST-001" },
    create: {
      id: "demo_store_001",
      name: "Demo Franchise Store",
      code: "DEMO-ST-001",
      email: "store.front@ecom.local",
      phone: "+910000000002",
      ownerId: owner.id,
      ceeUserId: cee.id,
    },
    update: {
      name: "Demo Franchise Store",
      ownerId: owner.id,
      ceeUserId: cee.id,
      isActive: true,
    },
  });

  const admin = await prisma.user.findUniqueOrThrow({
    where: { email: "admin.demo@ecom.local" },
  });
  const vUser = await prisma.user.findUniqueOrThrow({
    where: { id: "demo_vendor_user" },
  });
  const store = await prisma.store.findUniqueOrThrow({
    where: { code: "DEMO-ST-001" },
  });

  console.log("\n=== Demo data (password for every login: 12345678) ===\n");
  console.log("CORPORATE_ADMIN");
  console.log(`  id:       ${admin.id}`);
  console.log(`  email:    ${admin.email}\n`);
  console.log("VENDOR");
  console.log(`  email:      ${VENDOR_EMAIL}`);
  console.log(`  vendor id:  ${vendor.id}  (company record)`);
  console.log(`  user id:    ${vUser.id}  (login account)\n`);
  console.log("CEE");
  console.log(`  id:       ${cee.id}`);
  console.log(`  email:    ${cee.email}\n`);
  console.log("STORE_OWNER");
  console.log(`  id:       ${owner.id}`);
  console.log(`  email:    ${owner.email}\n`);
  console.log("STORE");
  console.log(`  id:       ${store.id}`);
  console.log(`  code:     ${store.code}`);
  console.log(`  name:     ${store.name}\n`);
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

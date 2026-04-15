import { client } from "../../../prisma/index";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { signUser } from "../../core/auth";
import { sendHtmlEmail } from "../emails/service";

const prisma = client;

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.nativeEnum(UserRole),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordRequestSchema = z.object({
  email: z.string().email(),
});

const forgotPasswordResetSchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/),
  newPassword: z.string().min(8),
});

function canUseForgotPassword(role: UserRole): boolean {
  return (
    role === UserRole.STORE_OWNER ||
    role === UserRole.CEE ||
    role === UserRole.CORPORATE_ADMIN ||
    role === UserRole.VENDOR
  );
}

export async function registerUser(input: unknown) {
  const data = registerSchema.parse(input);

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) {
    throw new Error("User already exists");
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
      role: data.role,
    },
  });

  const token = signUser({
    id: user.id,
    role: user.role,
    email: user.email,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}

export async function loginUser(input: unknown) {
  const data = loginSchema.parse(input);

  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const match = await bcrypt.compare(data.password, user.passwordHash);
  if (!match) {
    throw new Error("Invalid credentials");
  }

  const token = signUser({
    id: user.id,
    role: user.role,
    email: user.email,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}

/** Login for store frontend only — rejects non–STORE_OWNER. */
export async function loginUserForStore(input: unknown) {
  const result = await loginUser(input);
  if (result.user.role !== UserRole.STORE_OWNER) {
    throw new Error("NOT_ALLOWED_FOR_STORE");
  }
  return result;
}

const registerStoreSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

/** Register for store frontend only — always creates STORE_OWNER. */
export async function registerUserForStore(input: unknown) {
  const data = registerStoreSchema.parse(input);
  return registerUser({
    ...data,
    role: UserRole.STORE_OWNER,
  });
}

function hashOtp(otp: string): string {
  const secret = process.env.OTP_SECRET?.trim() || process.env.JWT_SECRET || "dev-otp-secret";
  return createHash("sha256").update(`${otp}:${secret}`).digest("hex");
}

function secureEqualHex(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "hex");
  const bBuf = Buffer.from(b, "hex");
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export async function requestForgotPasswordOtp(input: unknown) {
  const data = forgotPasswordRequestSchema.parse(input);
  const email = data.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !canUseForgotPassword(user.role)) {
    return { ok: true };
  }

  const otp = String(randomInt(100000, 1000000));
  const codeHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.passwordResetOtp.create({
    data: {
      userId: user.id,
      codeHash,
      expiresAt,
    },
  });

  await sendHtmlEmail(
    user.email,
    "Your password reset OTP",
    "FORGOT_PASSWORD_OTP",
    { role: user.role, expiresAt: expiresAt.toISOString() },
    `<p>Hello ${user.name},</p><p>Your OTP for password reset is <b>${otp}</b>.</p><p>This code expires in 10 minutes.</p>`,
  );

  return { ok: true };
}

export async function resetPasswordWithOtp(input: unknown) {
  const data = forgotPasswordResetSchema.parse(input);
  const email = data.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !canUseForgotPassword(user.role)) {
    throw new Error("Invalid reset request");
  }

  const otpRecord = await prisma.passwordResetOtp.findFirst({
    where: {
      userId: user.id,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) {
    throw new Error("OTP expired or not requested");
  }
  if (otpRecord.attempts >= 5) {
    throw new Error("Too many invalid OTP attempts. Please request a new OTP.");
  }

  const inputHash = hashOtp(data.otp);
  const matched = secureEqualHex(inputHash, otpRecord.codeHash);

  if (!matched) {
    await prisma.passwordResetOtp.update({
      where: { id: otpRecord.id },
      data: { attempts: { increment: 1 } },
    });
    throw new Error("Invalid OTP");
  }

  const passwordHash = await bcrypt.hash(data.newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    }),
    prisma.passwordResetOtp.update({
      where: { id: otpRecord.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetOtp.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
  ]);

  return { ok: true };
}

export async function syncStoreOwnersFromStores(input?: { defaultPassword?: string }) {
  const defaultPassword = input?.defaultPassword?.trim() || process.env.STORE_OWNER_DEFAULT_PASSWORD || "12345678";
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
      if (store.ownerId === existing.id) {
        updatedExisting++;
      } else {
        linkedExisting++;
      }
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

  return {
    ok: true,
    defaultPasswordNotice: "Set STORE_OWNER_DEFAULT_PASSWORD to avoid using fallback default.",
    counts: {
      totalStores: stores.length,
      created,
      linkedExisting,
      updatedExisting,
      skippedNoEmail,
      skippedRoleConflict,
    },
  };
}


import { client } from "../../../prisma/index";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signUser } from "../../core/auth";

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


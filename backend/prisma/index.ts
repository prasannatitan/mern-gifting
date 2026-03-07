import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv'
dotenv.config()
console.log(process.env.DATABASE_URL)
const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });

export const client = new PrismaClient({ adapter });
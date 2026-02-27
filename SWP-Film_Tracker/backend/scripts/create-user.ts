import 'dotenv/config';
import bcryptjs from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const args = process.argv.slice(2);

const getArg = (name: string) => {
  const index = args.findIndex((arg) => arg === `--${name}`);
  if (index === -1 || index + 1 >= args.length) {
    return undefined;
  }
  return args[index + 1];
};

async function main() {
  const email = getArg('email');
  const username = getArg('username');
  const password = getArg('password');
  const displayName = getArg('displayName') || username;

  if (!email || !username || !password) {
    console.error('Usage: npm run user:create -- --email <email> --username <username> --password <password> [--displayName <name>]');
    process.exit(1);
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (existing) {
    console.error('User already exists (email or username in use).');
    process.exit(1);
  }

  const hashedPassword = await bcryptjs.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      username,
      displayName: displayName || username,
      password: hashedPassword,
    },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      createdAt: true,
    },
  });

  console.log('✅ User created successfully');
  console.log(user);
}

main()
  .catch((error) => {
    console.error('❌ Failed to create user:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

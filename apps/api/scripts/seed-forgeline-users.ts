/**
 * Adds the Forgeline demo personas as real logins in the seeded organization:
 *   jordan@forgeline.dev (Jordan Rivera, MEMBER) and priya@forgeline.dev (Priya Shah, ADMIN).
 * Password: Password123!   Run: pnpm exec ts-node scripts/seed-forgeline-users.ts
 */
import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { OrgRole, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const prisma = new PrismaClient({ adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })) });

async function main(): Promise<void> {
  const org = await prisma.organization.findFirst({ where: { slug: 'acme' } });
  if (!org) throw new Error('Seed organization not found; run the main seed first.');
  await prisma.organization.update({ where: { id: org.id }, data: { name: 'Forgeline' } });
  const password = await bcrypt.hash('Password123!', 10);
  const personas = [
    { email: 'jordan@forgeline.dev', name: 'Jordan Rivera', username: 'jordan', role: OrgRole.MEMBER },
    { email: 'priya@forgeline.dev', name: 'Priya Shah', username: 'priya', role: OrgRole.ADMIN },
  ];
  for (const p of personas) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: { name: p.name },
      create: { email: p.email, password, name: p.name, username: p.username, emailVerifiedAt: new Date() },
    });
    await prisma.organizationMember.upsert({
      where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
      update: { role: p.role },
      create: { userId: user.id, organizationId: org.id, role: p.role },
    });
    console.log(`ready: ${p.email} (${p.name}, ${p.role})`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());

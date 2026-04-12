/**
 * Make a user admin by email.
 * Usage: npx tsx scripts/make-admin.ts user@example.com
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npx tsx scripts/make-admin.ts <email>");
    process.exit(1);
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  if (user.role === "ADMIN") {
    console.log(`${email} is already an ADMIN.`);
    process.exit(0);
  }

  await db.user.update({
    where: { email },
    data: { role: "ADMIN" },
  });

  console.log(`✅ ${user.name} (${email}) is now an ADMIN.`);
  console.log("   They need to log out and log back in for the change to take effect.");
}

main().finally(() => db.$disconnect());

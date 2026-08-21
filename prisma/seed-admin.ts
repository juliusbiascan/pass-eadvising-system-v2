import bcrypt from "bcryptjs";
import { db } from "../lib/db";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@passcollege.com";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "admin123";

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await db.user.upsert({
    where: { email },
    update: {
      name: "Admin",
      password: hashedPassword,
      role: "ADMIN",
      emailVerified: new Date(),
    },
    create: {
      email,
      name: "Admin",
      password: hashedPassword,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });

  console.log("Seeded admin user:", user.email);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

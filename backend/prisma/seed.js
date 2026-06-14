const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const usersData = [
  { name: "Aisha", email: "aisha@test.com" },
  { name: "Rohan", email: "rohan@test.com" },
  { name: "Priya", email: "priya@test.com" },
  { name: "Meera", email: "meera@test.com" },
  { name: "Sam", email: "sam@test.com" },
  { name: "Dev", email: "dev@test.com" }
];

async function main() {
  console.log("Seeding database...");
  
  // Use a default password for all seed users
  const defaultPassword = "Password123";
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  for (const user of usersData) {
    const upsertedUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        password: hashedPassword
      },
      create: {
        name: user.name,
        email: user.email,
        password: hashedPassword
      }
    });
    console.log(`Upserted user: ${upsertedUser.name} (${upsertedUser.email})`);
  }

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

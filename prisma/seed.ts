// Seed two demo teams + a project so you can poke around immediately.
// Run: npm run db:push && npm run seed
import { PrismaClient } from "@prisma/client";
import { generateApiKey, slugify } from "../src/lib/ids";

const prisma = new PrismaClient();

async function main() {
  const teams = [
    { name: "Frontend Squad", description: "Builds the user-facing UI." },
    { name: "Backend Squad", description: "Owns APIs and data." },
  ];
  const created = [];
  for (const t of teams) {
    const slug = slugify(t.name);
    const team = await prisma.team.upsert({
      where: { slug },
      update: {},
      create: { name: t.name, slug, description: t.description, apiKey: generateApiKey() },
    });
    created.push(team);
  }

  const project = await prisma.project.upsert({
    where: { slug: "checkout-revamp" },
    update: {},
    create: {
      name: "Checkout Revamp",
      slug: "checkout-revamp",
      description: "Q3 checkout redesign — cross-team effort.",
      memberships: {
        create: created.map((t, i) => ({ teamId: t.id, role: i === 0 ? "owner" : "member" })),
      },
    },
  });

  console.log("Seeded.");
  for (const t of created) {
    console.log(`  team ${t.name} (${t.slug})  apiKey=${t.apiKey}`);
  }
  console.log(`  project ${project.name} id=${project.id}`);
}

main().finally(() => prisma.$disconnect());

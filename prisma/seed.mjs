import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ROOM_CAPACITY = 12;

const EMPLOYEES = [
  { name: "Alexander Reed", department: "Executive", category: "Boss", priority: 1 },
  { name: "Beatrice Cole", department: "Executive", category: "Boss", priority: 2 },
  { name: "Charles Nguyen", department: "Finance", category: "Boss", priority: 3 },
  { name: "Diana Alvarez", department: "Operations", category: "Manager", priority: 10 },
  { name: "Edward Kim", department: "Operations", category: "Manager", priority: 12 },
  { name: "Fiona Barrett", department: "Sales", category: "Manager", priority: 15 },
  { name: "Gregory Hughes", department: "Engineering", category: "Manager", priority: 18 },
  { name: "Hana Suzuki", department: "Marketing", category: "Manager", priority: 22 },
  { name: "Ibrahim Khan", department: "Logistics", category: "Manager", priority: 25 },
  { name: "Julia Moretti", department: "Sales", category: "Staff", priority: 50 },
  { name: "Kevin Tan", department: "Engineering", category: "Staff", priority: 52 },
  { name: "Lucia Fernandez", department: "Engineering", category: "Staff", priority: 55 },
  { name: "Marcus Webb", department: "Support", category: "Staff", priority: 58 },
  { name: "Nadia Petrova", department: "Support", category: "Staff", priority: 60 },
  { name: "Oliver Grant", department: "Logistics", category: "Staff", priority: 63 },
  { name: "Priya Sharma", department: "Finance", category: "Staff", priority: 66 },
  { name: "Quentin Ross", department: "Marketing", category: "Staff", priority: 70 },
  { name: "Rosa Mendes", department: "Sales", category: "Staff", priority: 72 },
  { name: "Samuel Owens", department: "Engineering", category: "Staff", priority: 75 },
  { name: "Tara Lindqvist", department: "Support", category: "Staff", priority: 78 },
  { name: "Umar Farouk", department: "Logistics", category: "Staff", priority: 80 },
  { name: "Vera Novak", department: "Marketing", category: "Staff", priority: 83 },
  { name: "William Chen", department: "Engineering", category: "Staff", priority: 86 },
  { name: "Ximena Torres", department: "Sales", category: "Staff", priority: 88 },
  { name: "Yosef Levi", department: "Finance", category: "Staff", priority: 90 },
  { name: "Zara Ahmed", department: "Support", category: "Staff", priority: 92 },
  { name: "Adrian Vasquez", department: "Logistics", category: "Staff", priority: 95 },
  { name: "Bianca Rossi", department: "Marketing", category: "Staff", priority: 98, active: false },
];

function dateKey(offsetDays) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - offsetDays);
  return new Date(`${d.toISOString().slice(0, 10)}T00:00:00.000Z`);
}

function assign(diners) {
  const sorted = [...diners].sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
  return sorted.map((d, i) => ({ ...d, diningRoom: Math.floor(i / ROOM_CAPACITY) + 1 }));
}

async function main() {
  console.log("Seeding database...");

  await prisma.mealAssignment.deleteMany();
  await prisma.meal.deleteMany();
  await prisma.employee.deleteMany();

  const created = [];
  for (const e of EMPLOYEES) {
    created.push(await prisma.employee.create({ data: { active: true, ...e } }));
  }
  const active = created.filter((e) => e.active);

  // A few historical meals so the dashboard and charts are populated.
  const plans = [
    { offset: 4, meal: "Lunch", count: 14 },
    { offset: 4, meal: "Dinner", count: 9 },
    { offset: 3, meal: "Lunch", count: 20 },
    { offset: 3, meal: "Dinner", count: 11 },
    { offset: 2, meal: "Lunch", count: 25 },
    { offset: 2, meal: "Dinner", count: 8 },
    { offset: 1, meal: "Lunch", count: 18 },
    { offset: 1, meal: "Dinner", count: 13 },
  ];

  for (const p of plans) {
    const picked = active.slice(0, p.count).map((e) => ({
      employeeId: e.id,
      name: e.name,
      category: e.category,
      priority: e.priority,
      isGuest: false,
    }));
    const seated = assign(picked);

    await prisma.meal.create({
      data: {
        date: dateKey(p.offset),
        mealType: p.meal,
        assignments: { create: seated },
      },
    });
  }

  console.log(`Seeded ${created.length} employees and ${plans.length} meals.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

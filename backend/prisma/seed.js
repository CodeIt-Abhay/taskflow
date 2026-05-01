const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const daysAgo = (n) => new Date(Date.now() - n * 86400000);
const daysAhead = (n) => new Date(Date.now() + n * 86400000);

async function main() {
  console.log('🌱 Seeding database...');

  // ── Clean slate ──────────────────────────────────────────────────────────
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // ── Users ────────────────────────────────────────────────────────────────
  const adminPass = await bcrypt.hash('admin123', 10);
  const memberPass = await bcrypt.hash('member123', 10);
  const pass3 = await bcrypt.hash('pass123', 10);

  const admin = await prisma.user.create({
    data: { name: 'Alex Rivera', email: 'admin@demo.com', password: adminPass, role: 'Admin', avatar: 'AR' },
  });

  const member1 = await prisma.user.create({
    data: { name: 'Jamie Chen', email: 'member@demo.com', password: memberPass, role: 'Member', avatar: 'JC' },
  });

  const member2 = await prisma.user.create({
    data: { name: 'Morgan Lee', email: 'morgan@demo.com', password: pass3, role: 'Member', avatar: 'ML' },
  });

  // ── Projects ─────────────────────────────────────────────────────────────
  const proj1 = await prisma.project.create({
    data: {
      name: 'Website Redesign',
      description: 'Complete overhaul of the company website',
      owner: { connect: { id: admin.id } },
      members: { connect: [{ id: admin.id }, { id: member1.id }, { id: member2.id }] },
    },
  });

  const proj2 = await prisma.project.create({
    data: {
      name: 'Mobile App v2',
      description: 'Second version of the mobile application',
      owner: { connect: { id: admin.id } },
      members: { connect: [{ id: admin.id }, { id: member2.id }] },
    },
  });

  // ── Tasks ─────────────────────────────────────────────────────────────────
  const tasks = [
    {
      title: 'Design homepage mockup',
      description: 'Create Figma mockups for the homepage',
      status: 'Done', priority: 'High',
      projectId: proj1.id, assigneeId: member1.id,
      createdAt: daysAgo(10), dueDate: daysAgo(2),
    },
    {
      title: 'Implement navbar component',
      description: 'Build responsive navigation with mobile menu',
      status: 'In Progress', priority: 'High',
      projectId: proj1.id, assigneeId: member1.id,
      createdAt: daysAgo(7), dueDate: daysAhead(1),
    },
    {
      title: 'SEO optimisation',
      description: 'Meta tags, sitemap, robots.txt',
      status: 'Todo', priority: 'Medium',
      projectId: proj1.id, assigneeId: member2.id,
      createdAt: daysAgo(5), dueDate: daysAhead(5),
    },
    {
      title: 'Performance audit',
      description: 'Lighthouse audit and critical path fixes',
      status: 'Todo', priority: 'Low',
      projectId: proj1.id, assigneeId: admin.id,
      createdAt: daysAgo(3), dueDate: daysAgo(1),
    },
    {
      title: 'Auth flow redesign',
      description: 'New sign-in / sign-up flow with social login',
      status: 'In Progress', priority: 'High',
      projectId: proj2.id, assigneeId: member2.id,
      createdAt: daysAgo(8), dueDate: daysAhead(3),
    },
    {
      title: 'Push notifications',
      description: 'Integrate Firebase Cloud Messaging',
      status: 'Todo', priority: 'Medium',
      projectId: proj2.id, assigneeId: member2.id,
      createdAt: daysAgo(4), dueDate: daysAgo(1),
    },
    {
      title: 'Dark mode toggle',
      description: 'System-level dark/light mode support',
      status: 'Done', priority: 'Low',
      projectId: proj2.id, assigneeId: admin.id,
      createdAt: daysAgo(12), dueDate: daysAgo(5),
    },
  ];

  for (const task of tasks) {
    await prisma.task.create({ data: task });
  }

  console.log('✅ Seeding complete!');
  console.log('');
  console.log('Demo credentials:');
  console.log('  Admin:  admin@demo.com  / admin123');
  console.log('  Member: member@demo.com / member123');
  console.log('  Member: morgan@demo.com / pass123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

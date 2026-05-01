const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const fmtDate = (d) => (d ? new Date(d).toISOString().split('T')[0] : '');

const normalise = (t) => ({
  id: t.id,
  title: t.title,
  description: t.description,
  status: t.status,
  priority: t.priority,
  dueDate: fmtDate(t.dueDate),
  createdAt: fmtDate(t.createdAt),
  projectId: t.projectId,
  assigneeId: t.assigneeId || '',
});

// ── GET /api/tasks ────────────────────────────────────────────────────────────
// Returns all tasks in projects the current user is a member of
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        project: { members: { some: { id: req.user.id } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(tasks.map(normalise));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/tasks  (Admin only) ────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Only Admins can create tasks' });
    }

    const { title, description, projectId, status, priority, assigneeId, dueDate } = req.body;

    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
    if (!projectId) return res.status(400).json({ error: 'Project is required' });

    // Verify project exists and user is a member
    const project = await prisma.project.findFirst({
      where: { id: projectId, members: { some: { id: req.user.id } } },
    });
    if (!project) return res.status(404).json({ error: 'Project not found or access denied' });

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: (description || '').trim(),
        status: status || 'Todo',
        priority: priority || 'Medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        project: { connect: { id: projectId } },
        ...(assigneeId && { assignee: { connect: { id: assigneeId } } }),
      },
    });

    res.status(201).json(normalise(task));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PUT /api/tasks/:id ────────────────────────────────────────────────────────
// Admin: can update any field
// Member: can only update status of tasks assigned to them
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: { project: { include: { members: { select: { id: true } } } } },
    });

    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Must be a project member to do anything
    const isMember = task.project.members.some((m) => m.id === req.user.id);
    if (!isMember) return res.status(403).json({ error: 'Access denied' });

    if (req.user.role !== 'Admin') {
      // Members may only update the status of tasks assigned to them
      if (task.assigneeId !== req.user.id) {
        return res.status(403).json({ error: 'You can only update tasks assigned to you' });
      }
      const { status } = req.body;
      const updated = await prisma.task.update({
        where: { id: req.params.id },
        data: { status },
      });
      return res.json(normalise(updated));
    }

    // Admin — full update
    const { title, description, status, priority, assigneeId, dueDate, projectId } = req.body;

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title: title.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(assigneeId !== undefined && {
          assignee: assigneeId ? { connect: { id: assigneeId } } : { disconnect: true },
        }),
        ...(projectId && { project: { connect: { id: projectId } } }),
      },
    });

    res.json(normalise(updated));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── DELETE /api/tasks/:id  (Admin only) ──────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Only Admins can delete tasks' });
    }

    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

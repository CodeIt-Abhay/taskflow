const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const SELECT_USER = { id: true, name: true, email: true, role: true, avatar: true };

const fmtDate = (d) => (d ? new Date(d).toISOString().split('T')[0] : null);

const normalise = (p) => ({
  id: p.id,
  name: p.name,
  description: p.description,
  createdAt: fmtDate(p.createdAt),
  ownerId: p.ownerId,
  memberIds: (p.members || []).map((m) => m.id),
});

// ── GET /api/projects ────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { members: { some: { id: req.user.id } } },
      include: {
        owner: { select: SELECT_USER },
        members: { select: SELECT_USER },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(projects.map(normalise));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/projects  (Admin only) ─────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Only Admins can create projects' });
    }

    const { name, description, memberIds = [] } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Project name is required' });

    // Always include the creator
    const allIds = [...new Set([req.user.id, ...memberIds])];

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: (description || '').trim(),
        owner: { connect: { id: req.user.id } },
        members: { connect: allIds.map((id) => ({ id })) },
      },
      include: {
        owner: { select: SELECT_USER },
        members: { select: SELECT_USER },
      },
    });

    res.status(201).json(normalise(project));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PATCH /api/projects/:id  (Admin + owner only) ────────────────────────────
router.patch('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Only Admins can update projects' });
    }

    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Only the project owner can update it' });
    }

    const { name, description, memberIds } = req.body;
    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(memberIds && {
          members: { set: [...new Set([req.user.id, ...memberIds])].map((id) => ({ id })) },
        }),
      },
      include: {
        owner: { select: SELECT_USER },
        members: { select: SELECT_USER },
      },
    });

    res.json(normalise(updated));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── DELETE /api/projects/:id  (Admin + owner only) ───────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Only Admins can delete projects' });
    }

    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Only the project owner can delete it' });
    }

    // Tasks are cascade-deleted via schema onDelete: Cascade
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

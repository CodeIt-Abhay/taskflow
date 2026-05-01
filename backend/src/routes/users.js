const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const SELECT_USER = { id: true, name: true, email: true, role: true, avatar: true, createdAt: true };

// ── GET /api/users/me ────────────────────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: SELECT_USER,
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/users ───────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: SELECT_USER,
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Middleware to protect admin routes
function isAdmin(req, res, next) {
  if (req.session.isAdmin) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorised" });
  }
}

// POST - Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const correctUsername = username === process.env.ADMIN_USERNAME;
  const correctPassword = password === process.env.ADMIN_PASSWORD;

  if (correctUsername && correctPassword) {
    req.session.isAdmin = true;
    res.json({ message: "Logged in!" });
  } else {
    res.status(401).json({ error: "Invalid username or password" });
  }
});

// POST - Logout
router.post("/logout", (req, res) => {
  req.session.destroy();
  res.json({ message: "Logged out!" });
});

// GET - Check if logged in
router.get("/check", (req, res) => {
  res.json({ isAdmin: !!req.session.isAdmin });
});

// GET - All users (protected)
router.get("/users", isAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        tickets: {
          include: { pool: true }
        }
      }
    });
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// POST - Create pool (protected)
router.post("/pools", isAdmin, async (req, res) => {
  try {
    const { title, ticketPrice, ticketCap } = req.body;

    if (!title || !ticketPrice || !ticketCap) {
      return res.status(400).json({ error: "Please provide title, ticketPrice and ticketCap" });
    }

    const pool = await prisma.pool.create({
      data: { title, ticketPrice, ticketCap }
    });

    res.json({ message: "Pool created!", pool });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create pool" });
  }
});

// POST - Pick winner (protected)
router.post("/pools/:id/winner", isAdmin, async (req, res) => {
  try {
    const poolId = parseInt(req.params.id);

    const tickets = await prisma.ticket.findMany({
      where: { poolId },
      include: { user: true }
    });

    if (tickets.length === 0) {
      return res.status(400).json({ error: "No tickets sold for this pool yet!" });
    }

    const winningTicket = tickets[Math.floor(Math.random() * tickets.length)];

    await prisma.ticket.update({
      where: { id: winningTicket.id },
      data: { isWinner: true }
    });

    res.json({
      message: "Winner picked!",
      winner: {
        name: winningTicket.user.name,
        email: winningTicket.user.email,
        ticketId: winningTicket.id
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to pick winner" });
  }
});

module.exports = router;
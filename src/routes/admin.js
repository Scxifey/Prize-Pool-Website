const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const nodemailer = require("nodemailer");

const prisma = new PrismaClient();

// Helper function to send emails
async function sendEmail(to, subject, html) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    await transporter.sendMail({
      from: `"Prize Pool" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}`);
  } catch (err) {
    console.error("Email failed:", err);
  }
}

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
    let { title, ticketPrice, ticketCap } = req.body;

    // Sanitize inputs
    title = title ? title.trim().replace(/[<>]/g, '') : '';
    ticketPrice = parseFloat(ticketPrice);
    ticketCap = parseInt(ticketCap);

    if (!title) {
      return res.status(400).json({ error: "Please provide a title" });
    }

    if (title.length > 100) {
      return res.status(400).json({ error: "Title is too long" });
    }

    if (isNaN(ticketPrice) || ticketPrice < 0.30) {
      return res.status(400).json({ error: "Ticket price must be at least £0.30" });
    }

    if (isNaN(ticketCap) || ticketCap < 1 || ticketCap > 10000) {
      return res.status(400).json({ error: "Ticket cap must be between 1 and 10,000" });
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

    // Pick a random winner
    const winningTicket = tickets[Math.floor(Math.random() * tickets.length)];

    // Mark as winner
    await prisma.ticket.update({
      where: { id: winningTicket.id },
      data: { isWinner: true }
    });

    // Get pool details
    const pool = await prisma.pool.findUnique({ where: { id: poolId } });

    // Send winner email
    await sendEmail(
      winningTicket.user.email,
      `🏆 You won — ${pool.title}!`,
      `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0a0a0f; color: #e8e8f0; padding: 40px; border-radius: 12px;">
          <h1 style="color: #f5c518; font-size: 2rem; margin-bottom: 8px;">Prize Pool</h1>
          <p style="color: #7070a0; margin-bottom: 30px;">Winner Announcement</p>
          <h2 style="color: #f5c518; font-size: 1.6rem;">🏆 Congratulations!</h2>
          <p style="margin-top: 12px;">Hi <strong>${winningTicket.user.name}</strong>, you've been selected as the winner of <strong style="color: #f5c518;">${pool.title}</strong>!</p>
          <div style="background: #13131a; border: 1px solid #f5c518; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0; font-size: 0.85rem; color: #7070a0;">WINNING TICKET</p>
            <p style="margin: 4px 0 0; font-size: 1.4rem; color: #f5c518;">#${winningTicket.id}</p>
          </div>
          <p style="color: #7070a0; font-size: 0.9rem;">We'll be in touch shortly with your prize details. 🎉</p>
        </div>
      `
    );

    // Send loser emails to everyone else
    const losingTickets = tickets.filter(t => t.id !== winningTicket.id);
    const losingUsers = [...new Map(losingTickets.map(t => [t.user.email, t.user])).values()];

    for (const user of losingUsers) {
      await sendEmail(
        user.email,
        `Better luck next time — ${pool.title}`,
        `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0a0a0f; color: #e8e8f0; padding: 40px; border-radius: 12px;">
            <h1 style="color: #f5c518; font-size: 2rem; margin-bottom: 8px;">Prize Pool</h1>
            <p style="color: #7070a0; margin-bottom: 30px;">Draw Results</p>
            <h2 style="color: #e8e8f0; font-size: 1.6rem;">Thanks for entering!</h2>
            <p style="margin-top: 12px;">Hi <strong>${user.name}</strong>, unfortunately you didn't win the <strong style="color: #f5c518;">${pool.title}</strong> draw this time.</p>
            <div style="background: #13131a; border: 1px solid #2a2a3a; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <p style="margin: 0; font-size: 0.85rem; color: #7070a0;">WINNER</p>
              <p style="margin: 4px 0 0; font-size: 1.1rem; color: #e8e8f0;">${winningTicket.user.name}</p>
            </div>
            <p style="color: #7070a0; font-size: 0.9rem;">Don't give up — new pools are added regularly. Good luck next time! 🍀</p>
            <a href="${process.env.BASE_URL}" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #f5c518; color: #0a0a0f; text-decoration: none; border-radius: 8px; font-weight: 500;">View Active Pools</a>
          </div>
        `
      );
    }

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

// DELETE - Delete a pool (protected)
router.delete("/pools/:id", isAdmin, async (req, res) => {
  try {
    const poolId = parseInt(req.params.id);

    // Delete all tickets for this pool first
    await prisma.ticket.deleteMany({
      where: { poolId }
    });

    // Then delete the pool
    await prisma.pool.delete({
      where: { id: poolId }
    });

    res.json({ message: "Pool deleted!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete pool" });
  }
});

module.exports = router;
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const nodemailer = require("nodemailer");

const prisma = new PrismaClient();


// Helper function to send emails
async function sendEmail(to, subject, html) {
  try {
    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "loaded" : "MISSING");
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

// GET all pools
router.get("/", async (req, res) => {
  try {
    const pools = await prisma.pool.findMany();
    res.json({ pools });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch pools" });
  }
});

// POST - Create a new pool
router.post("/", async (req, res) => {
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

// POST - Buy a ticket
router.post("/:id/buy", async (req, res) => {
  try {
    const poolId = parseInt(req.params.id);
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Please provide name and email" });
    }

    // Find the pool
    const pool = await prisma.pool.findUnique({ where: { id: poolId } });
    if (!pool) {
      return res.status(404).json({ error: "Pool not found" });
    }

    // Check if sold out
    if (pool.ticketsSold >= pool.ticketCap) {
      return res.status(400).json({ error: "Sorry, this pool is sold out!" });
    }

    // Find or create the user
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({ data: { name, email } });
    }

    // Create the ticket
    const ticket = await prisma.ticket.create({
      data: { poolId, userId: user.id }
    });

    // Update tickets sold
    await prisma.pool.update({
      where: { id: poolId },
      data: { ticketsSold: { increment: 1 } }
    });

    // Send confirmation email
    await sendEmail(
      email,
      `🎟 Ticket Confirmed — ${pool.title}`,
      `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0a0a0f; color: #e8e8f0; padding: 40px; border-radius: 12px;">
          <h1 style="color: #f5c518; font-size: 2rem; margin-bottom: 8px;">Prize Pool</h1>
          <p style="color: #7070a0; margin-bottom: 30px;">Ticket Confirmation</p>
          <p>Hi <strong>${name}</strong>,</p>
          <p style="margin-top: 12px;">Your ticket for <strong style="color: #f5c518;">${pool.title}</strong> has been confirmed!</p>
          <div style="background: #13131a; border: 1px solid #2a2a3a; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0; font-size: 0.85rem; color: #7070a0;">TICKET ID</p>
            <p style="margin: 4px 0 0; font-size: 1.4rem; color: #f5c518;">#${ticket.id}</p>
          </div>
          <p style="color: #7070a0; font-size: 0.9rem;">Good luck! 🍀 We'll email you if you win.</p>
        </div>
      `
    );

    res.json({ message: "Ticket purchased successfully!", ticket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to purchase ticket" });
  }
});

// POST - Pick a winner
router.post("/:id/winner", async (req, res) => {
  try {
    const poolId = parseInt(req.params.id);

    // Get all tickets for this pool
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

    // Send winner email
    await sendEmail(
      winningTicket.user.email,
      `🏆 You won — ${winningTicket.user.name}!`,
      `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0a0a0f; color: #e8e8f0; padding: 40px; border-radius: 12px;">
          <h1 style="color: #f5c518; font-size: 2rem; margin-bottom: 8px;">Prize Pool</h1>
          <p style="color: #7070a0; margin-bottom: 30px;">Winner Announcement</p>
          <h2 style="color: #f5c518; font-size: 1.6rem;">🏆 Congratulations!</h2>
          <p style="margin-top: 12px;">Hi <strong>${winningTicket.user.name}</strong>, you've been selected as the winner!</p>
          <div style="background: #13131a; border: 1px solid #f5c518; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0; font-size: 0.85rem; color: #7070a0;">WINNING TICKET</p>
            <p style="margin: 4px 0 0; font-size: 1.4rem; color: #f5c518;">#${winningTicket.id}</p>
          </div>
          <p style="color: #7070a0; font-size: 0.9rem;">We'll be in touch shortly with your prize details. 🎉</p>
        </div>
      `
    );

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
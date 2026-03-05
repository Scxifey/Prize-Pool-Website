const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const nodemailer = require("nodemailer");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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

// POST - Create Stripe checkout session
router.post("/:id/checkout", async (req, res) => {
  try {
    const poolId = parseInt(req.params.id);
    let { name, email } = req.body;

    // Sanitize inputs
    name = name ? name.trim().replace(/[<>]/g, '') : '';
    email = email ? email.trim().toLowerCase() : '';

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!name || !email) {
      return res.status(400).json({ error: "Please provide name and email" });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Please provide a valid email address" });
    }

    if (name.length > 100) {
      return res.status(400).json({ error: "Name is too long" });
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

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: `Ticket — ${pool.title}`,
              description: `One entry into the ${pool.title} prize pool`,
            },
            unit_amount: Math.round(pool.ticketPrice * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.BASE_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BASE_URL}/cancel.html`,
      metadata: {
        poolId: poolId.toString(),
        name,
        email,
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// GET - Confirm payment and create ticket
router.get("/confirm", async (req, res) => {
  try {
    const { session_id } = req.query;

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      return res.status(400).json({ error: "Payment not completed" });
    }

    const { poolId, name, email } = session.metadata;

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({ data: { name, email } });
    }

    // Check if ticket already created for this session (prevent duplicates)
    const existingTicket = await prisma.ticket.findFirst({
      where: { stripeSessionId: session_id }
    });

    if (existingTicket) {
      return res.json({ message: "Ticket already created", ticket: existingTicket });
    }

    // Create the ticket
    const ticket = await prisma.ticket.create({
      data: {
        poolId: parseInt(poolId),
        userId: user.id,
        stripeSessionId: session_id
      }
    });

    // Update tickets sold
    await prisma.pool.update({
      where: { id: parseInt(poolId) },
      data: { ticketsSold: { increment: 1 } }
    });

    // Send confirmation email
    const pool = await prisma.pool.findUnique({ where: { id: parseInt(poolId) } });
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

    res.json({ message: "Ticket created!", ticket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to confirm payment" });
  }
});

module.exports = router;
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

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

module.exports = router;

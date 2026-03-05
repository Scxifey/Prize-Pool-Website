require("dotenv").config();
const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const poolsRouter = require("./routes/pools");
const adminRouter = require("./routes/admin");

const app = express();

app.set('trust proxy', 1); // trust first proxy for secure cookies

// Security headers
app.use(helmet({
  contentSecurityPolicy: false // disabled to allow Google Fonts to load
}));

// Rate limiting — max 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later." }
});

// Strict rate limit for buying tickets — max 10 per hour per IP
const buyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: "Too many ticket purchases, please try again later." }
});

// Strict rate limit for admin login — max 10 attempts per hour per IP
const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts, please try again later." }
});

app.use(express.json());
app.use(express.static("public"));

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Apply general rate limit to all routes
app.use(generalLimiter);

// Apply specific rate limits
app.use("/api/pools/:id/checkout", buyLimiter);
app.use("/api/admin/login", loginLimiter);

// Routes
app.use("/api/pools/:id/checkout", (req, res, next) => {
  if (req.params.id === 'confirm') return next();
  buyLimiter(req, res, next);
});
app.use("/api/admin", adminRouter);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
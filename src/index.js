require("dotenv").config();
const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const poolsRouter = require("./routes/pools");
const adminRouter = require("./routes/admin");

const app = express();

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false
}));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later." }
});

const buyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: "Too many ticket purchases, please try again later." }
});

const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts, please try again later." }
});

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

app.use(generalLimiter);

app.use("/api/pools/:id/checkout", (req, res, next) => {
  if (req.params.id === 'confirm') return next();
  buyLimiter(req, res, next);
});

app.use("/api/admin/login", loginLimiter);

// Routes first
app.use("/api/pools", poolsRouter);
app.use("/api/admin", adminRouter);

// Static files after routes
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
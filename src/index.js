require("dotenv").config();
const express = require("express");
const session = require("express-session");
const poolsRouter = require("./routes/pools");
const adminRouter = require("./routes/admin");

const app = express();

app.use(express.json());
app.use(express.static("public"));

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Routes
app.use("/api/pools", poolsRouter);
app.use("/api/admin", adminRouter);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
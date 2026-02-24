const express = require("express");
const poolsRouter = require("./routes/pools");

const app = express();

app.use(express.json());
app.use(express.static("public"));

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to the Prize Pool Website API. Go to /api/pools to see pools.");
});

app.use("/api/pools", poolsRouter);

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

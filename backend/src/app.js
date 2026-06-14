const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const groupRoutes = require("./routes/group.routes");

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);

// Base route for healthcheck
app.get("/", (req, res) => {
  res.json({
    message: "SettleWise API Running"
  });
});

module.exports = app;
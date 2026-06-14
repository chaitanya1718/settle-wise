const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const groupRoutes = require("./routes/group.routes");
const expenseRoutes = require("./routes/expense.routes");
const settlementRoutes = require("./routes/settlement.routes");
const balanceRoutes = require("./routes/balance.routes");

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/settlements", settlementRoutes);
app.use("/api", balanceRoutes); // Maps /api/groups/... and /api/users/...

// Base route for healthcheck
app.get("/", (req, res) => {
  res.json({
    message: "SettleWise API Running"
  });
});

module.exports = app;
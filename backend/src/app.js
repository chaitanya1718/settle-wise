const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const groupRoutes = require("./routes/group.routes");
const userRoutes = require("./routes/user.routes");
const expenseRoutes = require("./routes/expense.routes");
const settlementRoutes = require("./routes/settlement.routes");
const balanceRoutes = require("./routes/balance.routes");
const importRoutes = require("./routes/import.routes");
const importReviewRoutes = require("./routes/importReview.routes");

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://settle-wise-brown.vercel.app",
      "https://settle-wise-1lns5oufo-chaitanya1718s-projects.vercel.app",
      process.env.VITE_API_URL
    ],
    credentials: true
  })
);
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/users", userRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/settlements", settlementRoutes);
app.use("/api/import", importRoutes);
app.use("/api", importReviewRoutes); // Review workflow routes
app.use("/api", balanceRoutes); // Maps /api/groups/... and /api/users/...

// Base route for healthcheck
app.get("/", (req, res) => {
  res.json({
    message: "SettleWise API Running"
  });
});

module.exports = app;

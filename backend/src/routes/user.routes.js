const express = require("express");
const router = express.Router();
const prisma = require("../config/prisma");
const authMiddleware = require("../middleware/auth.middleware");

// Protect this route with auth middleware
router.use(authMiddleware);

/**
 * GET /api/users
 * Returns list of users: [{ id, name, email }]
 */
router.get("/", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true
      },
      orderBy: {
        name: "asc"
      }
    });
    return res.status(200).json(users);
  } catch (error) {
    console.error("Get users endpoint error:", error.message);
    return res.status(500).json({
      error: "Internal server error."
    });
  }
});

module.exports = router;

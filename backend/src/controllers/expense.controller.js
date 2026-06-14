const expenseService = require("../services/expense.service");

/**
 * Create a new expense.
 * POST /api/expenses
 */
const createExpense = async (req, res) => {
  try {
    const expense = await expenseService.createExpense(req.body);
    return res.status(201).json({
      success: true,
      message: "Expense created successfully.",
      expense
    });
  } catch (error) {
    console.error("Create expense controller error:", error.message);
    return res.status(400).json({
      error: error.message
    });
  }
};

/**
 * Get details of a single expense.
 * GET /api/expenses/:id
 */
const getExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await expenseService.getExpenseById(id);

    if (!expense) {
      return res.status(404).json({
        error: "Expense not found."
      });
    }

    return res.status(200).json(expense);
  } catch (error) {
    console.error("Get expense controller error:", error.message);
    return res.status(500).json({
      error: "Internal server error."
    });
  }
};

/**
 * Get all expenses.
 * GET /api/expenses
 */
const getAllExpenses = async (req, res) => {
  try {
    const expenses = await expenseService.getAllExpenses();
    return res.status(200).json(expenses);
  } catch (error) {
    console.error("Get all expenses controller error:", error.message);
    return res.status(500).json({
      error: "Internal server error."
    });
  }
};

/**
 * Get all expenses inside a group.
 * GET /api/groups/:groupId/expenses
 */
const getExpensesByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const expenses = await expenseService.getExpensesByGroupId(groupId);
    return res.status(200).json(expenses);
  } catch (error) {
    console.error("Get expenses by group controller error:", error.message);
    return res.status(500).json({
      error: "Internal server error."
    });
  }
};

/**
 * Update an existing expense.
 * PUT /api/expenses/:id
 */
const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedExpense = await expenseService.updateExpense(id, req.body);
    return res.status(200).json({
      message: "Expense updated successfully.",
      expense: updatedExpense
    });
  } catch (error) {
    console.error("Update expense controller error:", error.message);
    return res.status(400).json({
      error: error.message
    });
  }
};

/**
 * Delete an expense.
 * DELETE /api/expenses/:id
 */
const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await expenseService.deleteExpense(id);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Delete expense controller error:", error.message);
    return res.status(400).json({
      error: error.message
    });
  }
};

module.exports = {
  createExpense,
  getExpense,
  getAllExpenses,
  getExpensesByGroup,
  updateExpense,
  deleteExpense
};

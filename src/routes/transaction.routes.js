const { Router } = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const { createTransaction, createInitialFundsTransaction } = require('../controllers/transaction.controller');
const transactionRoutes = Router();

/**
 * POST /api/transactions/
 * Create new Transaction
 */
transactionRoutes.post("/", authMiddleware.authMiddleware, createTransaction);

/**
 * POST /api/transactions/system/initial-funds
 * Create initial funds transaction from system users
 */
transactionRoutes.post("/system/initial-funds", authMiddleware.authSystemUserMiddleware, createInitialFundsTransaction);

module.exports = transactionRoutes;
import { Router } from 'express';
import {
    getTransactions,
    createTransaction,
    getFinancialSummary,
    getAccountsReceivable,
    createAccountReceivable,
    receivePayment,
    getAccountsPayable,
    createAccountPayable,
    makePayment,
} from '../controllers/finance.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// All finance routes are protected
router.use(authenticate, requireAdmin);

// Transactions
router.get('/transactions', getTransactions);
router.post('/transactions', createTransaction);
router.get('/summary', getFinancialSummary);

// Accounts Receivable
router.get('/receivable', getAccountsReceivable);
router.post('/receivable', createAccountReceivable);
router.post('/receivable/:id/payment', receivePayment);

// Accounts Payable
router.get('/payable', getAccountsPayable);
router.post('/payable', createAccountPayable);
router.post('/payable/:id/payment', makePayment);

export default router;

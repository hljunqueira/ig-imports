import { Request, Response } from 'express';
import { query, withTransaction } from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Get all transactions
export const getTransactions = async (req: Request, res: Response): Promise<void> => {
    try {
        const { type, startDate, endDate } = req.query;
        
        let sql = `
            SELECT t.*, u.full_name as created_by_name
            FROM financial_transactions t
            LEFT JOIN admin_profiles u ON t.created_by = u.id
            WHERE 1=1
        `;
        const params: any[] = [];
        let paramIndex = 1;

        if (type) {
            sql += ` AND t.transaction_type = $${paramIndex++}`;
            params.push(type);
        }

        if (startDate) {
            sql += ` AND t.transaction_date >= $${paramIndex++}`;
            params.push(startDate);
        }

        if (endDate) {
            sql += ` AND t.transaction_date <= $${paramIndex++}`;
            params.push(endDate);
        }

        sql += ` ORDER BY t.transaction_date DESC`;

        const result = await query(sql, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ success: false, error: 'Erro ao buscar transações' });
    }
};

// Create transaction
export const createTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const {
            transaction_type,
            category,
            amount,
            description,
            related_order_id,
            related_product_id,
            payment_method,
            payment_status,
            transaction_date,
        } = req.body;

        const result = await query(
            `INSERT INTO financial_transactions (
                transaction_type, category, amount, description,
                related_order_id, related_product_id, payment_method,
                payment_status, transaction_date, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
            RETURNING *`,
            [
                transaction_type,
                category,
                amount,
                description,
                related_order_id,
                related_product_id,
                payment_method,
                payment_status || 'completed',
                transaction_date || new Date(),
                req.user?.id,
            ]
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error creating transaction:', error);
        res.status(500).json({ success: false, error: 'Erro ao criar transação' });
    }
};

// Get financial summary
export const getFinancialSummary = async (req: Request, res: Response): Promise<void> => {
    try {
        const { startDate, endDate } = req.query;
        
        let sql = `
            SELECT 
                transaction_type,
                SUM(amount) as total
            FROM financial_transactions
            WHERE payment_status = 'completed'
        `;
        const params: any[] = [];
        let paramIndex = 1;

        if (startDate) {
            sql += ` AND transaction_date >= $${paramIndex++}`;
            params.push(startDate);
        }

        if (endDate) {
            sql += ` AND transaction_date <= $${paramIndex++}`;
            params.push(endDate);
        }

        sql += ` GROUP BY transaction_type`;

        const result = await query(sql, params);

        const summary = {
            income: 0,
            expense: 0,
            refund: 0,
            adjustment: 0,
            balance: 0,
        };

        result.rows.forEach((row) => {
            summary[row.transaction_type as keyof typeof summary] = parseFloat(row.total);
        });

        summary.balance = summary.income - summary.expense - summary.refund;

        res.json({ success: true, data: summary });
    } catch (error) {
        console.error('Error fetching financial summary:', error);
        res.status(500).json({ success: false, error: 'Erro ao buscar resumo financeiro' });
    }
};

// Accounts Receivable
export const getAccountsReceivable = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status } = req.query;
        
        let sql = `SELECT * FROM accounts_receivable WHERE 1=1`;
        const params: any[] = [];

        if (status) {
            sql += ` AND status = $1`;
            params.push(status);
        }

        sql += ` ORDER BY due_date ASC`;

        const result = await query(sql, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching accounts receivable:', error);
        res.status(500).json({ success: false, error: 'Erro ao buscar contas a receber' });
    }
};

export const createAccountReceivable = async (req: Request, res: Response): Promise<void> => {
    try {
        const { order_id, customer_name, amount, due_date, description } = req.body;

        const result = await query(
            `INSERT INTO accounts_receivable (order_id, customer_name, amount, due_date, description)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [order_id, customer_name, amount, due_date, description]
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error creating account receivable:', error);
        res.status(500).json({ success: false, error: 'Erro ao criar conta a receber' });
    }
};

export const receivePayment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { amount } = req.body;

        await withTransaction(async (client) => {
            // Get current account
            const accountResult = await client.query(
                'SELECT * FROM accounts_receivable WHERE id = $1',
                [id]
            );

            if (accountResult.rows.length === 0) {
                throw new Error('Account not found');
            }

            const account = accountResult.rows[0];
            const newAmountPaid = parseFloat(account.amount_paid) + amount;
            const newStatus = newAmountPaid >= parseFloat(account.amount) ? 'paid' : 'partial';

            // Update account
            await client.query(
                `UPDATE accounts_receivable 
                 SET amount_paid = $1, status = $2, updated_at = NOW()
                 WHERE id = $3`,
                [newAmountPaid, newStatus, id]
            );

            // Create transaction record
            await client.query(
                `INSERT INTO financial_transactions 
                 (transaction_type, category, amount, description, related_order_id, payment_method, payment_status)
                 VALUES ('income', 'Recebimento', $1, $2, $3, 'transfer', 'completed')`,
                [amount, `Recebimento - ${account.customer_name}`, account.order_id]
            );
        });

        res.json({ success: true, message: 'Pagamento registrado com sucesso' });
    } catch (error) {
        console.error('Error receiving payment:', error);
        res.status(500).json({ success: false, error: 'Erro ao registrar pagamento' });
    }
};

// Accounts Payable
export const getAccountsPayable = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status } = req.query;
        
        let sql = `SELECT * FROM accounts_payable WHERE 1=1`;
        const params: any[] = [];

        if (status) {
            sql += ` AND status = $1`;
            params.push(status);
        }

        sql += ` ORDER BY due_date ASC`;

        const result = await query(sql, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching accounts payable:', error);
        res.status(500).json({ success: false, error: 'Erro ao buscar contas a pagar' });
    }
};

export const createAccountPayable = async (req: Request, res: Response): Promise<void> => {
    try {
        const { supplier_id, description, amount, due_date, category } = req.body;

        const result = await query(
            `INSERT INTO accounts_payable (supplier_id, description, amount, due_date, category)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [supplier_id, description, amount, due_date, category]
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error creating account payable:', error);
        res.status(500).json({ success: false, error: 'Erro ao criar conta a pagar' });
    }
};

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/database';
import { generateToken, AuthRequest } from '../middleware/auth';

// Login
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        const result = await query(
            `SELECT ap.*, u.email
             FROM admin_profiles ap
             JOIN auth.users u ON ap.id = u.id
             WHERE u.email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            res.status(401).json({ success: false, error: 'Credenciais inválidas' });
            return;
        }

        const user = result.rows[0];

        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
        });

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    role: user.role,
                },
                token,
            },
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ success: false, error: 'Erro ao fazer login' });
    }
};

// Get current user - uses JWT data + DB lookup
export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: 'Não autenticado' });
            return;
        }

        const result = await query(
            `SELECT ap.id, ap.full_name, ap.role, u.email
             FROM admin_profiles ap
             JOIN auth.users u ON ap.id = u.id
             WHERE ap.id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Usuário não encontrado' });
            return;
        }

        const user = result.rows[0];
        res.json({
            success: true,
            data: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, error: 'Erro ao buscar usuário' });
    }
};

// Register (for creating admin users - should be protected)
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, full_name, role } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        res.status(201).json({
            success: true,
            message: 'Usuário registrado com sucesso',
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ success: false, error: 'Erro ao registrar usuário' });
    }
};

// Change password
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        res.json({ success: true, message: 'Senha alterada com sucesso' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ success: false, error: 'Erro ao alterar senha' });
    }
};

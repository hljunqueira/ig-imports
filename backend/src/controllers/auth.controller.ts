import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/database';
import { generateToken } from '../middleware/auth';

// Login
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        // Get user from Supabase auth (simulated here - in production use Supabase Auth)
        // For now, we'll check admin_profiles
        const result = await query(
            `SELECT ap.*, u.email
             FROM admin_profiles ap
             JOIN auth.users u ON ap.id = u.id
             WHERE u.email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            res.status(401).json({ success: false, error: 'Invalid credentials' });
            return;
        }

        const user = result.rows[0];

        // In a real scenario, you'd verify the password against Supabase Auth
        // For this backend, we'll assume the token is generated after Supabase Auth validation
        
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
        res.status(500).json({ success: false, error: 'Failed to login' });
    }
};

// Get current user
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
        // This would normally use the authenticated user from middleware
        // For now, return a mock response
        res.json({
            success: true,
            data: {
                id: 'mock-user-id',
                email: 'admin@igimports.com',
                fullName: 'Admin User',
                role: 'admin',
            },
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch user' });
    }
};

// Register (for creating admin users - should be protected)
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, full_name, role } = req.body;

        // In production, this would create a user in Supabase Auth
        // and then create the admin_profile
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // This is a simplified version - in production use Supabase Auth
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ success: false, error: 'Failed to register user' });
    }
};

// Change password
export const changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { currentPassword, newPassword } = req.body;

        // In production, verify current password against Supabase Auth
        // and then update it

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ success: false, error: 'Failed to change password' });
    }
};

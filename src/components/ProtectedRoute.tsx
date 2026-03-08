import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, isLoading, hasCheckedAuth, checkAuth } = useAuthStore();
    const location = useLocation();

    useEffect(() => {
        if (!hasCheckedAuth) {
            checkAuth();
        }
    }, [hasCheckedAuth, checkAuth]);

    // Aguarda verificação antes de redirecionar
    if (isLoading || !hasCheckedAuth) {
        return (
            <div className="min-h-screen bg-background-dark flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] uppercase tracking-widest text-gray-500">
                        Verificando acesso...
                    </p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;


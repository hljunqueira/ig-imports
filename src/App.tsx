import React, { useEffect } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import Catalog from './pages/Catalog';
import ProductDetails from './pages/ProductDetails';
import ClientArea from './pages/ClientArea';
import Checkout from './pages/Checkout';
import AdminLayout from './pages/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import CartDrawer from './components/CartDrawer';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from './store/authStore';

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <div key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/product/:slug" element={<ProductDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/client-area" element={<ClientArea />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/:section"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    // Verifica auth ao iniciar a aplicação (token salvo no localStorage)
    checkAuth();
  }, []);

  return (
    <HashRouter>
      <AnimatedRoutes />
      <CartDrawer />
    </HashRouter>
  );
};

export default App;

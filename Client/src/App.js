import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import WorkspaceLayout from './components/Workspace/WorkspaceLayout';
import ExportPage from './pages/ExportPage';

// Компонент для защиты роутов
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  // Проверяем наличие токена прямо в момент рендера
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const isAuthenticated = !!localStorage.getItem('token'); // ⚠️ Вычисляется ОДИН раз при загрузке сайта!
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* Оборачиваем защищенные страницы в ProtectedRoute */}
        <Route 
          path="/dashboard" 
          element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} 
        />
        <Route 
          path="/editor/:id" 
          element={<ProtectedRoute><WorkspaceLayout /></ProtectedRoute>} 
        />
        <Route 
          path="/export/:id" 
          element={<ProtectedRoute><ExportPage /></ProtectedRoute>} 
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
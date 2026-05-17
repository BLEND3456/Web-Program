import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
// ВОТ ЭТА СТРОКА ОБЯЗАТЕЛЬНА:
import WorkspaceLayout from './components/Workspace/WorkspaceLayout'; 
import ExportPage from './pages/ExportPage';

function App() {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <DashboardPage /> : <Navigate transition to="/login" />} 
        />
        {/* Здесь используется WorkspaceLayout */}
        <Route 
          path="/editor/:id" 
          element={isAuthenticated ? <WorkspaceLayout /> : <Navigate to="/login" />} 
        />
        <Route path="/export/:id" element={<ExportPage />} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
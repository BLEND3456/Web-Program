import { useNavigate } from 'react-router-dom';
import ProjectList from '../components/Dashboard/ProjectList';
import Button from '../components/UI/Button';

const DashboardPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <header className="bg-gradient-to-r from-slate-800 to-slate-700 shadow-lg p-6 flex justify-between items-center border-b border-slate-600">
        <h1 className="font-bold text-2xl text-white">📰 Газетный редактор</h1>
        <Button onClick={handleLogout} variant="secondary">Выйти</Button>
      </header>
      <ProjectList />
    </div>
  );
};

export default DashboardPage;
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { exportAPI } from '../services/api';
import Button from '../components/UI/Button';

const ExportPage = () => {
  const { presetId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      await exportAPI.generatePDF(presetId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-md text-center space-y-4">
        <h2 className="text-2xl font-bold">Экспорт в PDF</h2>
        <p>Проект #{presetId}</p>
        {error && <p className="text-red-500">{error}</p>}
        <Button onClick={handleGenerate} disabled={loading} variant="success" className="w-full">
          {loading ? 'Генерация...' : 'Скачать PDF'}
        </Button>
        <button
          onClick={() => navigate(`/editor/${presetId}`)}
          className="text-blue-600 hover:underline text-sm block"
        >
          Вернуться к редактированию
        </button>
      </div>
    </div>
  );
};

export default ExportPage;
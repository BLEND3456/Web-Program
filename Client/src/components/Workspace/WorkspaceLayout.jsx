import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WorkspaceProvider, useWorkspace } from '../../context/WorkspaceContext';
import Toolbar from './Toolbar';
import CanvasView from './CanvasView';
import PropertyPanel from './PropertyPanel';
import LayersPanel from './LayersPanel';
import Button from '../UI/Button';
import { projectsAPI, designPresetsAPI } from '../../services/api';

const WorkspaceInner = () => {
  const { presetId } = useParams();
  const navigate = useNavigate();
  const { canvas } = useWorkspace();
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState('properties'); // 'properties' или 'layers'
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [savingPreset, setSavingPreset] = useState(false);

  const handleSave = async () => {
    if (!canvas) return;
    const json = canvas.toJSON();
    try {
      await projectsAPI.save(presetId, json);
      alert('✓ Сохранено успешно');
    } catch (err) {
      alert('✗ Ошибка сохранения');
    }
  };

  const handleSaveAsPreset = async (e) => {
    e.preventDefault();
    if (!canvas || !presetName.trim()) {
      alert('Введите название пресета');
      return;
    }

    setSavingPreset(true);
    try {
      const designSettings = canvas.toJSON();
      await designPresetsAPI.create({
        name: presetName,
        description: presetDescription,
        designSettings,
      });
      alert('✓ Пресет сохранен успешно!');
      setShowSavePresetModal(false);
      setPresetName('');
      setPresetDescription('');
    } catch (err) {
      alert('✗ Ошибка сохранения пресета');
      console.error(err);
    } finally {
      setSavingPreset(false);
    }
  };

  const handleExport = () => {
    navigate(`/export/${presetId}`);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Верхняя панель */}
      <div className="h-16 bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600 flex items-center px-6 shadow-lg">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-all duration-200 hover:shadow-lg"
        >
          <span className="text-xl">←</span>
          <span className="font-medium">Вернуться</span>
        </button>
        
        <h1 className="flex-1 text-center font-bold text-2xl text-white ml-4">
          📰 Газетный редактор
        </h1>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/50 flex items-center gap-2"
          >
            <span>💾</span>
            Сохранить
          </button>
          <button
            onClick={() => setShowSavePresetModal(true)}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-medium transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/50 flex items-center gap-2"
          >
            <span>🎨</span>
            Сохранить как пресет
          </button>
          <button
            onClick={handleExport}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-medium transition-all duration-200 hover:shadow-lg hover:shadow-green-500/50 flex items-center gap-2"
          >
            <span>📄</span>
            Экспорт PDF
          </button>
        </div>
      </div>

      {/* Модальное окно сохранения пресета */}
      {showSavePresetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
            <h3 className="text-2xl font-bold mb-6">🎨 Сохранить как пресет</h3>
            <form onSubmit={handleSaveAsPreset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название пресета
                </label>
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-purple-500 focus:outline-none transition"
                  placeholder="Новостная статья"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание (опционально)
                </label>
                <textarea
                  value={presetDescription}
                  onChange={(e) => setPresetDescription(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-purple-500 focus:outline-none transition resize-none"
                  placeholder="Описание стиля пресета..."
                  rows="3"
                />
              </div>

              <p className="text-sm text-gray-600 bg-gray-100 p-3 rounded-lg">
                ℹ️ Текущий дизайн страницы будет сохранён как шаблон. Позже вы сможете применить его к новым проектам одним кликом.
              </p>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSavePresetModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-medium hover:bg-gray-300 transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={savingPreset}
                  className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 text-white font-medium hover:from-purple-700 hover:to-purple-600 transition shadow-lg disabled:opacity-50"
                >
                  {savingPreset ? 'Сохранение...' : '🎨 Сохранить пресет'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Рабочая область */}
      <div className="flex flex-1 overflow-hidden gap-3 p-4">
        {/* Левая панель инструментов */}
        <div className="flex-shrink-0">
          <Toolbar />
        </div>

        {/* Центральная часть - Canvas */}
        <div className="flex-1 flex flex-col">
          <CanvasView />
        </div>

        {/* Правая панель - выбор между свойствами и слоями */}
        <div className="flex-shrink-0 w-72">
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setShowRightPanel('properties')}
              className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                showRightPanel === 'properties'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
              }`}
            >
              ⚙️ Свойства
            </button>
            <button
              onClick={() => setShowRightPanel('layers')}
              className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                showRightPanel === 'layers'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
              }`}
            >
              📑 Слои
            </button>
          </div>
          {showRightPanel === 'properties' ? <PropertyPanel /> : <LayersPanel />}
        </div>
      </div>
    </div>
  );
};

const WorkspaceLayout = () => (
  <WorkspaceProvider>
    <WorkspaceInner />
  </WorkspaceProvider>
);

export default WorkspaceLayout;
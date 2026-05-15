import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI, designPresetsAPI } from '../../services/api';
import Button from '../UI/Button';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteProjectId, setDeleteProjectId] = useState(null);
  const [formData, setFormData] = useState({
    name: 'Новый проект',
    width: 800,
    height: 1000,
    presetId: null,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsData, presetsData] = await Promise.all([
          projectsAPI.getAll(),
          designPresetsAPI.getAll()
        ]);
        setProjects(projectsData);
        setPresets(presetsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const newProject = await projectsAPI.create({
        name: formData.name,
        width: parseInt(formData.width),
        height: parseInt(formData.height),
        presetId: formData.presetId ? parseInt(formData.presetId) : null,
      });
      setShowModal(false);
      setFormData({ name: 'Новый проект', width: 800, height: 1000, presetId: null });
      setProjects([...projects, newProject]);
      navigate(`/editor/${newProject.id}`);
    } catch (err) {
      alert('Ошибка создания проекта');
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteProjectId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteProjectId) return;
    try {
      await projectsAPI.delete(deleteProjectId);
      setProjects((prev) => prev.filter((p) => p.id !== deleteProjectId));
      setShowDeleteModal(false);
      setDeleteProjectId(null);
    } catch (err) {
      alert('Ошибка удаления проекта');
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteProjectId(null);
  };

  if (loading) return <div className="text-center mt-8">Загрузка...</div>;

  const projectToDelete = projects.find(p => p.id === deleteProjectId);

  return (
    <div className="max-w-6xl mx-auto mt-8 p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">📁 Мои проекты</h2>
        <Button onClick={() => setShowModal(true)}>✨ Новый проект</Button>
      </div>

      {/* Модальное окно создания */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md max-h-96 overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">📋 Новый проект</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название проекта
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none transition"
                  placeholder="Новостная статья"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📐 Ширина (px)
                  </label>
                  <input
                    type="number"
                    value={formData.width}
                    onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none transition"
                    min="400"
                    max="2000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📏 Высота (px)
                  </label>
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none transition"
                    min="400"
                    max="2000"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🎨 Выберите пресет дизайна (опционально)
                </label>
                <select
                  value={formData.presetId || ''}
                  onChange={(e) => setFormData({ ...formData, presetId: e.target.value })}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none transition"
                >
                  <option value="">Без пресета</option>
                  {presets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-600 text-center">
                <p>Размер: <strong>{formData.width}×{formData.height}px</strong></p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-medium hover:bg-gray-300 transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium hover:from-blue-700 hover:to-blue-600 transition shadow-lg"
                >
                  ✨ Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения удаления */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm">
            <div className="text-center space-y-4">
              <div className="text-5xl">⚠️</div>
              <h3 className="text-2xl font-bold">Подтверждение удаления</h3>
              <p className="text-gray-600">
                Вы уверены, что хотите удалить проект <strong>"{projectToDelete?.name}"</strong>?
              </p>
              <p className="text-sm text-gray-500">Это действие нельзя отменить.</p>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-medium hover:bg-gray-300 transition"
                >
                  Отмена
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-500 text-white font-medium hover:from-red-700 hover:to-red-600 transition shadow-lg"
                >
                  🗑️ Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Список проектов */}
      {projects.length === 0 ? (
        <p className="text-gray-500 text-center py-12">Пока нет проектов. Создайте новый! ✨</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <div key={project.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
              <h3 className="font-bold text-lg mb-2">{project.name}</h3>
              <p className="text-xs text-gray-500 mb-4">📐 {project.width}×{project.height}px</p>
              <div className="space-x-2 flex">
                <Button onClick={() => navigate(`/editor/${project.id}`)} variant="secondary" className="flex-1">
                  ✏️ Редактировать
                </Button>
                <Button onClick={() => navigate(`/export/${project.id}`)} variant="success" className="flex-1">
                  📄 PDF
                </Button>
                <Button onClick={() => handleDeleteClick(project.id)} variant="danger" className="flex-1">
                  🗑️
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectList;
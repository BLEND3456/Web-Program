import { useState } from 'react';
import { authAPI } from '../../services/api';

const ResetPasswordForm = ({ onSuccess, onCancel }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      return setError('Новый пароль должен содержать минимум 8 символов');
    }

    try {
      await authAPI.resetPassword(name, email, newPassword);
      onSuccess('Пароль успешно изменен! Теперь вы можете войти.');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Ошибка сброса пароля');
    }
  };

  const inputStyles = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-6">Сброс пароля</h2>
      <p className="text-center text-sm text-gray-500 mb-4">
        Введите ваш логин и email, чтобы установить новый пароль.
      </p>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium">
          {error}
        </div>
      )}

      <div>
        <input type="text" placeholder="Ваш логин" value={name} onChange={(e) => setName(e.target.value)} className={inputStyles} required />
      </div>
      <div>
        <input type="email" placeholder="Ваш Email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputStyles} required />
      </div>

      <div className="relative">
        <input type={showPassword ? "text" : "password"} placeholder="Новый пароль" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputStyles} required />
        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 text-xl leading-none">
          {showPassword ? "🙈" : "👁️"}
        </button>
      </div>

      <button type="submit" className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors">
        Сменить пароль
      </button>
      <button type="button" onClick={onCancel} className="w-full py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-colors mt-2">
        Отмена
      </button>
    </form>
  );
};

export default ResetPasswordForm;
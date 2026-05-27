import { useState } from 'react';
import { authAPI } from '../../services/api';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const ResetPasswordForm = ({ onSuccess, onCancel }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) return setError('Новый пароль должен содержать минимум 8 символов');

    try {
      await authAPI.resetPassword(name, email, newPassword);
      onSuccess('Пароль успешно изменен! Теперь вы можете войти.');
    } catch (err) {
      setError(err.message || 'Ошибка сброса пароля');
    }
  };

  const inputStyles = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all pl-11";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-300">
      <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-4">Сброс пароля</h2>
      <p className="text-sm text-gray-500 text-center mb-6">
        Введите ваш логин и email, чтобы установить новый пароль.
      </p>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium">
          {error}
        </div>
      )}

      <div className="relative">
        <User className="absolute left-4 top-3.5" color="#9ca3af" size={20} />
        <input type="text" placeholder="Ваш логин" value={name} onChange={(e) => setName(e.target.value)} className={inputStyles} required />
      </div>
      
      <div className="relative">
        <Mail className="absolute left-4 top-3.5" color="#9ca3af" size={20} />
        <input type="email" placeholder="Ваш Email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputStyles} required />
      </div>

      <div className="relative">
        <Lock className="absolute left-4 top-3.5" color="#9ca3af" size={20} />
        <input type={showPassword ? "text" : "password"} placeholder="Новый пароль" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputStyles} required />
        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-gray-400 hover:text-blue-500 transition-colors">
          {showPassword ? <EyeOff color="#9ca3af" size={20} /> : <Eye color="#9ca3af" size={20} />}
        </button>
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <button type="submit" className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-600/30">
          Сменить пароль
        </button>
        <button type="button" onClick={onCancel} className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors">
          Отмена
        </button>
      </div>
    </form>
  );
};

export default ResetPasswordForm;
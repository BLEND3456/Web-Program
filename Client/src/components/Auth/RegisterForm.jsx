import { useState } from 'react';
import { authAPI } from '../../services/api';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const RegisterForm = ({ onSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (/\d/.test(name)) return setError('Логин не должен содержать цифры');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return setError('Введите корректный email');
    if (password.length < 8) return setError('Пароль должен содержать минимум 8 символов');
    if (password !== confirmPassword) return setError('Пароли не совпадают');

    try {
      await authAPI.register(name, email, password);
      onSuccess(); 
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Ошибка при регистрации');
    }
  };

  const inputStyles = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all pl-11";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-300">
      <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-6">Регистрация</h2>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium">
          {error}
        </div>
      )}

      <div className="relative">
        <User className="absolute left-4 top-3.5" color="#9ca3af" size={20} />
        <input type="text" placeholder="Имя (Логин)" value={name} onChange={(e) => setName(e.target.value)} className={inputStyles} required />
      </div>

      <div className="relative">
        <Mail className="absolute left-4 top-3.5" color="#9ca3af" size={20} />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputStyles} required />
      </div>
      
      <div className="relative">
        <Lock className="absolute left-4 top-3.5" color="#9ca3af" size={20} />
        <input type={showPassword ? "text" : "password"} placeholder="Пароль (минимум 8 символов)" value={password} onChange={(e) => setPassword(e.target.value)} className={inputStyles} minLength="8" required />
        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-gray-400 hover:text-blue-500 transition-colors">
          {showPassword ? <EyeOff color="#9ca3af" size={20} /> : <Eye color="#9ca3af" size={20} />}
        </button>
      </div>

      <div className="relative">
        <Lock className="absolute left-4 top-3.5" color="#9ca3af" size={20} />
        <input type={showConfirmPassword ? "text" : "password"} placeholder="Повторите пароль" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputStyles} minLength="8" required />
        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-3.5 text-gray-400 hover:text-blue-500 transition-colors">
          {showConfirmPassword ? <EyeOff color="#9ca3af" size={20} /> : <Eye color="#9ca3af" size={20} />}
        </button>
      </div>

      <button type="submit" className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-600/30 mt-2">
        Создать аккаунт
      </button>
    </form>
  );
};

export default RegisterForm;
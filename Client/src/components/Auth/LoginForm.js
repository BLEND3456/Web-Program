import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';

const LoginForm = ({ onForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Стейт для глазика
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
  
    try {
      const response = await authAPI.login(email, password);
      if (response && response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response));
        navigate('/dashboard');
      } else {
        setError('Токен не получен от сервера');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Ошибка входа');
    }
  };

  const inputStyles = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-6">Вход</h2>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium">
          {error}
        </div>
      )}
      
      <div>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputStyles}
          required
        />
      </div>
      
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputStyles}
          required
        />
        {/* Кнопка-глазик, абсолютно спозиционированная поверх поля ввода */}
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none text-xl leading-none"
        >
          {showPassword ? "🙈" : "👁️"}
        </button>
      </div>

      <div className="text-right">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
        >
          Забыли пароль?
        </button>
      </div>

      <button type="submit" className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors">
        Войти
      </button>
    </form>
  );
};

export default LoginForm;
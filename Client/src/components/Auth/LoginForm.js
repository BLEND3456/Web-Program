import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import Button from '../UI/Button';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
  
    try {
      const response = await authAPI.login(email, password);
      console.log('Ответ от сервера:', response);
  
      if (response && response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response));
        console.log('Токен сохранен:', response.token);
        navigate('/dashboard');
      } else {
        setError('Токен не получен от сервера');
      }
    } catch (err) {
      console.error('Ошибка при входе:', err);
      setError(err.response?.data?.message || err.message || 'Ошибка входа');
    }
  };

  // Такие же красивые инпуты, как и в регистрации
  const inputStyles = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-6">Вход</h2>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
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
      <div>
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputStyles}
          required
        />
      </div>
      
      <Button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md transition-all">
        Войти
      </Button>
    </form>
  );
};

export default LoginForm;
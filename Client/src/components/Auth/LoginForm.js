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
      
      if (response.token) {
        localStorage.setItem('token', response.token);
        console.log('Токен сохранен:', response.token);
        navigate('/dashboard');
      } else {
        setError('Токен не получен от сервера');
      }
    } catch (err) {
      console.error('Ошибка при входе:', err);
      setError(err.message || 'Ошибка входа');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold text-center">Вход</h2>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border px-3 py-2 rounded"
        required
      />
      <input
        type="password"
        placeholder="Пароль"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full border px-3 py-2 rounded"
        required
      />
      <Button type="submit" className="w-full">Войти</Button>
    </form>
  );
};

export default LoginForm;
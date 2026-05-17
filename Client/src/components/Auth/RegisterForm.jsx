import { useState } from 'react';
// Убираем useNavigate, он здесь больше не нужен
import { authAPI } from '../../services/api';
import Button from '../UI/Button';

// Принимаем пропс onSuccess от LoginPage
const RegisterForm = ({ onSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await authAPI.register(name, email, password);
      // Вызываем переключение на вкладку "Вход" без перезагрузки страницы
      onSuccess(); 
    } catch (err) {
      setError(err.message || 'Ошибка при регистрации');
    }
  };

  // Общие стили для полей ввода, чтобы не дублировать код
  const inputStyles = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-6">Регистрация</h2>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
          {error}
        </div>
      )}
      
      <div>
        <input
          type="text"
          placeholder="Ваше имя"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputStyles}
          required
        />
      </div>
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
          placeholder="Придумайте пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputStyles}
          required
        />
      </div>
      
      <Button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md transition-all">
        Зарегистрироваться
      </Button>
    </form>
  );
};

export default RegisterForm;
import { useState } from 'react';
import { authAPI } from '../../services/api';

const RegisterForm = ({ onSuccess }) => {
  const [name, setName] = useState(''); // Работает как логин
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Проверка логина (запрет цифр)
    if (/\d/.test(name)) {
      return setError('Логин не должен содержать цифры');
    }

    // Проверка правильности email шаблона
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return setError('Введите корректный email (например, name@gmail.com)');
    }

    // Проверка длины пароля
    if (password.length < 8) {
      return setError('Пароль должен содержать минимум 8 символов');
    }

    // Проверка подтверждения пароля
    if (password !== confirmPassword) {
      return setError('Пароли не совпадают');
    }

    try {
      await authAPI.register(name, email, password);
      onSuccess(); 
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Ошибка при регистрации');
    }
  };

  const inputStyles = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all";
  const eyeBtnStyles = "absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none text-xl leading-none";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-6">Регистрация</h2>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium">
          {error}
        </div>
      )}
      
      <div>
        <input
          type="text"
          placeholder="Придумайте логин"
          value={name}
          onChange={(e) => setName(e.target.value.replace(/\d/g, ''))} // Автоматически вырезаем цифры при вводе
          className={inputStyles}
          required
        />
      </div>
      <div>
        <input
          type="email"
          placeholder="Email (например, mail@gmail.com)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputStyles}
          required
        />
      </div>
      
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Пароль (минимум 8 символов)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputStyles}
          minLength="8"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className={eyeBtnStyles}
        >
          {showPassword ? "🙈" : "👁️"}
        </button>
      </div>

      <div className="relative">
        <input
          type={showConfirmPassword ? "text" : "password"}
          placeholder="Повторите пароль"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={inputStyles}
          minLength="8"
          required
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          className={eyeBtnStyles}
        >
          {showConfirmPassword ? "🙈" : "👁️"}
        </button>
      </div>

      <button type="submit" className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors">
        Зарегистрироваться
      </button>
    </form>
  );
};

export default RegisterForm;
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import {
  authTitle,
  authInput,
  authError,
  authLink,
  authSubmit,
  authIconBtn
} from './authFormStyles';

const LoginForm = ({ onForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      setError(err.message || 'Ошибка входа');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-300">
      <h2 className={authTitle}>Вход</h2>

      {error && <div className={authError}>{error}</div>}

      <div className="relative">
        <Mail className="absolute left-4 top-3.5 text-slate-400 pointer-events-none" size={20} />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={authInput}
          autoComplete="email"
          required
        />
      </div>

      <div className="relative">
        <Lock className="absolute left-4 top-3.5 text-slate-400 pointer-events-none" size={20} />
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={authInput}
          autoComplete="current-password"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className={authIconBtn}
          aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      <div className="text-right">
        <button type="button" onClick={onForgotPassword} className={authLink}>
          Забыли пароль?
        </button>
      </div>

      <button type="submit" className={authSubmit}>
        Войти
      </button>
    </form>
  );
};

export default LoginForm;

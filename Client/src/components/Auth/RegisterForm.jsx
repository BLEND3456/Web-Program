import { useState } from 'react';
import { authAPI } from '../../services/api';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import {
  authTitle,
  authInput,
  authError,
  authSubmit,
  authIconBtn
} from './authFormStyles';

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
      setError(err.message || 'Ошибка при регистрации');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-300">
      <h2 className={authTitle}>Регистрация</h2>

      {error && <div className={authError}>{error}</div>}

      <div className="relative">
        <User className="absolute left-4 top-3.5 text-slate-400 pointer-events-none" size={20} />
        <input type="text" placeholder="Имя (Логин)" value={name} onChange={(e) => setName(e.target.value)} className={authInput} autoComplete="username" required />
      </div>

      <div className="relative">
        <Mail className="absolute left-4 top-3.5 text-slate-400 pointer-events-none" size={20} />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={authInput} autoComplete="email" required />
      </div>

      <div className="relative">
        <Lock className="absolute left-4 top-3.5 text-slate-400 pointer-events-none" size={20} />
        <input type={showPassword ? 'text' : 'password'} placeholder="Пароль (минимум 8 символов)" value={password} onChange={(e) => setPassword(e.target.value)} className={authInput} minLength={8} autoComplete="new-password" required />
        <button type="button" onClick={() => setShowPassword(!showPassword)} className={authIconBtn} aria-label="Показать пароль">
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      <div className="relative">
        <Lock className="absolute left-4 top-3.5 text-slate-400 pointer-events-none" size={20} />
        <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Повторите пароль" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={authInput} minLength={8} autoComplete="new-password" required />
        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className={authIconBtn} aria-label="Показать пароль">
          {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      <button type="submit" className={`${authSubmit} mt-2`}>
        Создать аккаунт
      </button>
    </form>
  );
};

export default RegisterForm;

import { useState } from 'react';
import { authAPI } from '../../services/api';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import {
  authTitle,
  authSubtitle,
  authInput,
  authError,
  authSubmit,
  authSecondaryBtn,
  authIconBtn
} from './authFormStyles';

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

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-300">
      <h2 className={`${authTitle} mb-4`}>Сброс пароля</h2>
      <p className={authSubtitle}>
        Введите ваш логин и email, чтобы установить новый пароль.
      </p>

      {error && <div className={authError}>{error}</div>}

      <div className="relative">
        <User className="absolute left-4 top-3.5 text-slate-400 pointer-events-none" size={20} />
        <input type="text" placeholder="Ваш логин" value={name} onChange={(e) => setName(e.target.value)} className={authInput} autoComplete="username" required />
      </div>

      <div className="relative">
        <Mail className="absolute left-4 top-3.5 text-slate-400 pointer-events-none" size={20} />
        <input type="email" placeholder="Ваш Email" value={email} onChange={(e) => setEmail(e.target.value)} className={authInput} autoComplete="email" required />
      </div>

      <div className="relative">
        <Lock className="absolute left-4 top-3.5 text-slate-400 pointer-events-none" size={20} />
        <input type={showPassword ? 'text' : 'password'} placeholder="Новый пароль" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={authInput} autoComplete="new-password" required />
        <button type="button" onClick={() => setShowPassword(!showPassword)} className={authIconBtn} aria-label="Показать пароль">
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <button type="submit" className={authSubmit}>
          Сменить пароль
        </button>
        <button type="button" onClick={onCancel} className={authSecondaryBtn}>
          Отмена
        </button>
      </div>
    </form>
  );
};

export default ResetPasswordForm;

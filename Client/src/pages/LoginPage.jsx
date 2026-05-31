import { useState } from 'react';
import LoginForm from '../components/Auth/LoginForm';
import RegisterForm from '../components/Auth/RegisterForm';
import ResetPasswordForm from '../components/Auth/ResetPasswordForm';
import ThemeToggle from '../components/UI/ThemeToggle';
import { useTheme } from '../context/ThemeContext';

const AUTH_BACKGROUNDS = {
  dark: `${process.env.PUBLIC_URL}/images/auth/bg-dark.png`,
  light: `${process.env.PUBLIC_URL}/images/auth/bg-light.png`,
};

const LoginPage = () => {
  const { theme } = useTheme();
  // Теперь храним режим: 'login', 'register' или 'reset'
  const [authMode, setAuthMode] = useState('login'); 
  const [successMessage, setSuccessMessage] = useState('');

  const handleSuccessAndGoToLogin = (message) => {
    setAuthMode('login'); 
    setSuccessMessage(message); 
  };

  const toggleMode = () => {
    setAuthMode(authMode === 'login' ? 'register' : 'login');
    setSuccessMessage(''); 
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat transition-[background-image] duration-300"
      style={{ backgroundImage: `url(${AUTH_BACKGROUNDS[theme]})` }}
    >
      <ThemeToggle className="fixed top-6 right-6 z-50" />
      <div className="bg-white dark:bg-app-surface p-8 sm:p-10 rounded-2xl shadow-xl dark:shadow-black/40 border border-slate-200 dark:border-app-border w-full max-w-md transition-all">
        
        {successMessage && authMode === 'login' && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-500/30 text-green-800 dark:text-green-300 rounded-xl text-center text-sm font-medium">
            {successMessage}
          </div>
        )}

        {authMode === 'register' && (
          <RegisterForm onSuccess={() => handleSuccessAndGoToLogin('Аккаунт успешно создан! Теперь вы можете войти.')} />
        )}
        
        {authMode === 'login' && (
          <LoginForm onForgotPassword={() => { setAuthMode('reset'); setSuccessMessage(''); }} />
        )}

        {authMode === 'reset' && (
          <ResetPasswordForm 
            onSuccess={(msg) => handleSuccessAndGoToLogin(msg)} 
            onCancel={() => setAuthMode('login')} 
          />
        )}

        {authMode !== 'reset' && (
          <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
            {authMode === 'register' ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}{' '}
            <button onClick={toggleMode} className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline transition-colors focus:outline-none">
              {authMode === 'register' ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
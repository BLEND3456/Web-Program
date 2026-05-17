import { useState } from 'react';
import LoginForm from '../components/Auth/LoginForm';
import RegisterForm from '../components/Auth/RegisterForm';
import ResetPasswordForm from '../components/Auth/ResetPasswordForm'; // Подключаем новую форму

const LoginPage = () => {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl w-full max-w-md transition-all">
        
        {successMessage && authMode === 'login' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-center text-sm font-medium animate-pulse">
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
          <div className="mt-6 text-center text-sm text-gray-600">
            {authMode === 'register' ? 'Уже есть аккаунт?' : 'Нет аккаунта?'} <button onClick={toggleMode} className="text-blue-600 font-semibold hover:text-blue-800 hover:underline transition-colors focus:outline-none">
              {authMode === 'register' ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
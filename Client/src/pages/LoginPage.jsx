import { useState } from 'react';
import LoginForm from '../components/Auth/LoginForm';
import RegisterForm from '../components/Auth/RegisterForm';

const LoginPage = () => {
  const [showRegister, setShowRegister] = useState(false);

  return (
    // Добавили приятный градиентный фон на всю страницу
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Сделали карточку более современной: больше скругление (rounded-2xl) и мягкая тень (shadow-xl) */}
      <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl w-full max-w-md transition-all">
        
        {/* Передаем функцию onSuccess в RegisterForm */}
        {showRegister ? (
          <RegisterForm onSuccess={() => setShowRegister(false)} />
        ) : (
          <LoginForm />
        )}

        <div className="mt-6 text-center text-sm text-gray-600">
          {showRegister ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}{' '}
          <button
            onClick={() => setShowRegister(!showRegister)}
            className="text-blue-600 font-semibold hover:text-blue-800 hover:underline transition-colors focus:outline-none"
          >
            {showRegister ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
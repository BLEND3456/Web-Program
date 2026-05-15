import { useState } from 'react';
import LoginForm from '../components/Auth/LoginForm';
import RegisterForm from '../components/Auth/RegisterForm';

const LoginPage = () => {
  const [showRegister, setShowRegister] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
        {showRegister ? <RegisterForm /> : <LoginForm />}
        <p className="mt-4 text-center text-sm">
          {showRegister ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}{' '}
          <button
            onClick={() => setShowRegister(!showRegister)}
            className="text-blue-600 hover:underline"
          >
            {showRegister ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
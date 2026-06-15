import { Link } from 'react-router-dom';
import ThemeToggle from '../components/UI/ThemeToggle';
import PrivacyPolicyContent from '../components/Auth/PrivacyPolicyContent';

const PrivacyPolicyPage = () => (
  <div className="min-h-screen bg-slate-100 dark:bg-zinc-950 text-slate-800 dark:text-slate-200">
    <ThemeToggle className="fixed top-6 right-6 z-50" />

    <div className="max-w-3xl mx-auto px-6 py-12 md:py-16">
      <Link
        to="/login"
        className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-10 group"
      >
        <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
        Вернуться ко входу
      </Link>

      <header className="mb-10 pb-8 border-b border-slate-200 dark:border-zinc-800">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400 mb-3">
          NEWS EDIT
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
          Политика обработки персональных данных
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Дата последнего обновления: 31 мая 2026 г. · Редакция в соответствии с 152-ФЗ
        </p>
      </header>

      <PrivacyPolicyContent />

      <footer className="mt-14 pt-8 border-t border-slate-200 dark:border-zinc-800 text-center">
        <Link
          to="/login"
          className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Перейти к регистрации
        </Link>
      </footer>
    </div>
  </div>
);

export default PrivacyPolicyPage;

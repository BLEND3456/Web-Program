import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAppSettings } from '../../context/AppSettingsContext';
import { authAPI, projectsAPI, designPresetsAPI } from '../../services/api';
import { getTrashIds, clearAllTrashIds } from '../../utils/dashboardStorage';

const Section = ({ title, children, danger }) => (
  <section className={`rounded-[2rem] border p-8 ${danger ? 'border-rose-500/30 bg-rose-500/5' : 'border-app-border bg-app-surface'}`}>
    <h2 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-6 ${danger ? 'text-rose-400' : 'text-app-muted'}`}>
      {title}
    </h2>
    <div className="space-y-5">{children}</div>
  </section>
);

const Row = ({ label, desc, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b border-app-border last:border-0 last:pb-0 first:pt-0">
    <div className="min-w-0">
      <p className="text-sm font-semibold text-app-text">{label}</p>
      {desc && <p className="text-xs text-app-muted mt-0.5">{desc}</p>}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

const Toggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-app-hover-strong'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
  </button>
);

const Select = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="bg-app-hover border border-app-border rounded-xl px-3 py-2 text-sm text-app-text outline-none focus:border-indigo-500 min-w-[140px]"
  >
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

const Btn = ({ children, onClick, variant = 'default', disabled, loading }) => {
  const styles = {
    default: 'bg-app-hover hover:bg-app-hover-strong text-app-text border-app-border',
    primary: 'bg-indigo-600 hover:bg-indigo-500 text-white border-transparent',
    danger: 'bg-rose-600/15 hover:bg-rose-600/25 text-rose-400 border-rose-500/30',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all disabled:opacity-50 ${styles[variant]}`}
    >
      {loading ? '…' : children}
    </button>
  );
};

const estimateBytes = (projects, presets) => {
  let bytes = 0;
  const add = (val) => {
    if (!val) return;
    const s = typeof val === 'string' ? val : JSON.stringify(val);
    bytes += new Blob([s]).size;
  };
  projects.forEach((p) => {
    add(p.designSettings);
    add(p.previewUrl);
    add(p.name);
  });
  presets.forEach((p) => {
    add(p.designSettings);
    add(p.thumbnail);
  });
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key?.startsWith('project_preview_')) {
      add(sessionStorage.getItem(key));
    }
  }
  return bytes;
};

const formatMb = (bytes) => `${(bytes / (1024 * 1024)).toFixed(0)} МБ`;

const ConfirmModal = ({ open, title, message, confirmLabel, onClose, onConfirm, loading }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-app-overlay backdrop-blur-md flex items-center justify-center z-[200]">
      <div className="bg-app-surface border border-app-border p-8 rounded-[2rem] w-[400px] shadow-2xl">
        <h3 className="text-lg font-bold text-app-text mb-2">{title}</h3>
        <p className="text-sm text-app-muted mb-6">{message}</p>
        <div className="flex gap-3">
          <Btn onClick={onClose}>Отмена</Btn>
          <Btn variant="danger" onClick={onConfirm} loading={loading}>{confirmLabel}</Btn>
        </div>
      </div>
    </div>
  );
};

const SettingsSection = ({ onStorageChange }) => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { settings, updateSetting } = useAppSettings();
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  });
  const [stats, setStats] = useState({ projects: 0, files: 0, trash: 0, usedBytes: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [pwdForm, setPwdForm] = useState({ newPassword: '', confirm: '' });
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const STORAGE_LIMIT_MB = 500;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingStats(true);
      try {
        const [projects, presets] = await Promise.all([
          projectsAPI.getAll(),
          designPresetsAPI.getMine().catch(() => []),
        ]);
        if (cancelled) return;
        const trashCount = getTrashIds().size;
        const activeProjects = projects.filter((p) => !getTrashIds().has(String(p.id)));
        setStats({
          projects: activeProjects.length,
          files: projects.length + presets.length,
          trash: trashCount,
          usedBytes: estimateBytes(projects, presets),
        });
      } catch {
        if (!cancelled) {
          setStats((s) => ({ ...s, trash: getTrashIds().size }));
        }
      } finally {
        if (!cancelled) setLoadingStats(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [onStorageChange]);

  const handlePasswordChange = async () => {
    setPwdMsg('');
    if (pwdForm.newPassword.length < 8) {
      setPwdMsg('Пароль должен быть не менее 8 символов');
      return;
    }
    if (pwdForm.newPassword !== pwdForm.confirm) {
      setPwdMsg('Пароли не совпадают');
      return;
    }
    setPwdLoading(true);
    try {
      await authAPI.resetPassword(user.name, user.email, pwdForm.newPassword);
      setPwdMsg('Пароль успешно изменён');
      setPwdForm({ newPassword: '', confirm: '' });
    } catch (err) {
      setPwdMsg(err.message || 'Не удалось сменить пароль');
    } finally {
      setPwdLoading(false);
    }
  };

  const handleClearTrash = async () => {
    setActionLoading(true);
    try {
      const ids = clearAllTrashIds();
      await Promise.all(ids.map((id) => projectsAPI.delete(id).catch(() => null)));
      onStorageChange?.();
      setStats((s) => ({ ...s, trash: 0 }));
      setConfirm(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCleanUnused = () => {
    const projectIds = new Set();
    try {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith('project_preview_')) {
          const id = key.replace('project_preview_', '');
          projectIds.add(id);
        }
      });
    } catch { /* */ }
    projectsAPI.getAll().then((projects) => {
      const valid = new Set(projects.map((p) => String(p.id)));
      let removed = 0;
      projectIds.forEach((id) => {
        if (!valid.has(id)) {
          sessionStorage.removeItem(`project_preview_${id}`);
          removed++;
        }
      });
      setConfirm(null);
      alert(removed > 0 ? `Удалено кэшированных файлов: ${removed}` : 'Неиспользуемых файлов не найдено');
    });
  };

  const handleDeleteAllProjects = async () => {
    setActionLoading(true);
    try {
      const projects = await projectsAPI.getAll();
      await Promise.all(projects.map((p) => projectsAPI.delete(p.id).catch(() => null)));
      clearAllTrashIds();
      onStorageChange?.();
      setStats({ projects: 0, files: 0, trash: 0, usedBytes: 0 });
      setConfirm(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogoutAll = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleDeleteAccount = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/login');
  };

  const usedMb = formatMb(stats.usedBytes);
  const limitMb = `${STORAGE_LIMIT_MB} МБ`;
  const usagePct = Math.min(100, (stats.usedBytes / (STORAGE_LIMIT_MB * 1024 * 1024)) * 100);

  return (
    <div className="max-w-3xl space-y-6 pb-8">
      <Section title="Профиль">
        <Row label="Имя пользователя">
          <span className="text-sm text-app-text-secondary font-medium">{user.name || '—'}</span>
        </Row>
        <Row label="Email">
          <span className="text-sm text-app-text-secondary font-medium">{user.email || '—'}</span>
        </Row>
        <Row label="Смена пароля" desc="Новый пароль — не менее 8 символов">
          <div className="flex flex-col gap-2 w-full sm:w-auto sm:min-w-[220px]">
            <input
              type="password"
              placeholder="Новый пароль"
              value={pwdForm.newPassword}
              onChange={(e) => setPwdForm((f) => ({ ...f, newPassword: e.target.value }))}
              className="bg-app-hover border border-app-border rounded-xl px-3 py-2 text-sm text-app-text outline-none focus:border-indigo-500 w-full"
            />
            <input
              type="password"
              placeholder="Подтвердите пароль"
              value={pwdForm.confirm}
              onChange={(e) => setPwdForm((f) => ({ ...f, confirm: e.target.value }))}
              className="bg-app-hover border border-app-border rounded-xl px-3 py-2 text-sm text-app-text outline-none focus:border-indigo-500 w-full"
            />
            <Btn variant="primary" onClick={handlePasswordChange} loading={pwdLoading}>Сохранить</Btn>
            {pwdMsg && <p className="text-xs text-app-muted">{pwdMsg}</p>}
          </div>
        </Row>
      </Section>

      <Section title="Внешний вид">
        <Row label="Тёмная тема">
          <Toggle checked={theme === 'dark'} onChange={(on) => setTheme(on ? 'dark' : 'light')} />
        </Row>
        <Row label="Светлая тема">
          <Toggle checked={theme === 'light'} onChange={(on) => setTheme(on ? 'light' : 'dark')} />
        </Row>
        <Row label="Размер интерфейса">
          <Select
            value={String(settings.uiScale)}
            onChange={(v) => updateSetting('uiScale', Number(v))}
            options={[
              { value: '100', label: '100%' },
              { value: '110', label: '110%' },
              { value: '125', label: '125%' },
            ]}
          />
        </Row>
      </Section>

      <Section title="Редактор">
        <Row label="Автосохранение">
          <Toggle checked={settings.autosave} onChange={(v) => updateSetting('autosave', v)} />
        </Row>
        <Row label="Интервал автосохранения" desc={settings.autosave ? undefined : 'Включите автосохранение'}>
          <Select
            value={String(settings.autosaveInterval)}
            onChange={(v) => updateSetting('autosaveInterval', Number(v))}
            options={[
              { value: '30', label: '30 сек' },
              { value: '60', label: '1 мин' },
              { value: '120', label: '2 мин' },
              { value: '300', label: '5 мин' },
            ]}
          />
        </Row>
        <Row label="Привязка к сетке">
          <Toggle checked={settings.snapToGrid} onChange={(v) => updateSetting('snapToGrid', v)} />
        </Row>
        <Row label="Показывать направляющие">
          <Toggle checked={settings.showGuides} onChange={(v) => updateSetting('showGuides', v)} />
        </Row>
        <Row label="Показывать линейки">
          <Toggle checked={settings.showRulers} onChange={(v) => updateSetting('showRulers', v)} />
        </Row>
      </Section>

      <Section title="Экспорт">
        <Row label="Формат по умолчанию">
          <Select
            value={settings.exportFormat}
            onChange={(v) => updateSetting('exportFormat', v)}
            options={[{ value: 'pdf', label: 'PDF' }]}
          />
        </Row>
        <Row label="Качество экспорта">
          <Select
            value={settings.exportQuality}
            onChange={(v) => updateSetting('exportQuality', v)}
            options={[
              { value: 'standard', label: 'Стандартное' },
              { value: 'high', label: 'Высокое' },
              { value: 'max', label: 'Максимальное' },
            ]}
          />
        </Row>
        <Row label="Встраивать шрифты в PDF">
          <Toggle checked={settings.embedFonts} onChange={(v) => updateSetting('embedFonts', v)} />
        </Row>
      </Section>

      <Section title="Хранилище">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-app-muted">Использовано места</span>
              <span className="font-semibold text-app-text">
                {loadingStats ? '…' : `${usedMb} / ${limitMb}`}
              </span>
            </div>
            <div className="h-2 rounded-full bg-app-hover overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${usagePct}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="text-center p-4 rounded-2xl bg-app-hover">
              <p className="text-2xl font-bold text-app-text">{loadingStats ? '—' : stats.projects}</p>
              <p className="text-[10px] font-bold text-app-muted uppercase tracking-wider mt-1">Проектов</p>
            </div>
            <div className="text-center p-4 rounded-2xl bg-app-hover">
              <p className="text-2xl font-bold text-app-text">{loadingStats ? '—' : stats.files}</p>
              <p className="text-[10px] font-bold text-app-muted uppercase tracking-wider mt-1">Файлов</p>
            </div>
            <div className="text-center p-4 rounded-2xl bg-app-hover">
              <p className="text-2xl font-bold text-app-text">{loadingStats ? '—' : stats.trash}</p>
              <p className="text-[10px] font-bold text-app-muted uppercase tracking-wider mt-1">Корзина</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Btn
              onClick={() => setConfirm({ type: 'trash' })}
              disabled={stats.trash === 0}
            >
              Очистить корзину
            </Btn>
            <Btn onClick={() => setConfirm({ type: 'unused' })}>
              Удалить неиспользуемые файлы
            </Btn>
          </div>
        </div>
      </Section>

      <Section title="Безопасность">
        <Row label="Сменить пароль" desc="Форма выше в разделе «Профиль»">
          <Btn onClick={() => document.querySelector('input[type=password]')?.focus()}>Перейти</Btn>
        </Row>
        <Row label="Выйти со всех устройств" desc="Завершит текущую сессию">
          <Btn variant="danger" onClick={() => setConfirm({ type: 'logoutAll' })}>Выйти</Btn>
        </Row>
      </Section>

      <Section title="Опасная зона" danger>
        <div className="flex flex-wrap gap-3">
          <Btn variant="danger" onClick={() => setConfirm({ type: 'deleteAll' })}>
            Очистить все проекты
          </Btn>
          <Btn variant="danger" onClick={() => setConfirm({ type: 'deleteAccount' })}>
            Удалить аккаунт
          </Btn>
        </div>
      </Section>

      <ConfirmModal
        open={confirm?.type === 'trash'}
        title="Очистить корзину?"
        message="Проекты в корзине будут удалены навсегда. Это действие нельзя отменить."
        confirmLabel="Очистить"
        loading={actionLoading}
        onClose={() => setConfirm(null)}
        onConfirm={handleClearTrash}
      />
      <ConfirmModal
        open={confirm?.type === 'unused'}
        title="Удалить неиспользуемые файлы?"
        message="Будут удалены кэшированные превью проектов, которых больше нет в библиотеке."
        confirmLabel="Удалить"
        onClose={() => setConfirm(null)}
        onConfirm={handleCleanUnused}
      />
      <ConfirmModal
        open={confirm?.type === 'logoutAll'}
        title="Выйти со всех устройств?"
        message="Текущая сессия будет завершена. Потребуется войти снова."
        confirmLabel="Выйти"
        onClose={() => setConfirm(null)}
        onConfirm={handleLogoutAll}
      />
      <ConfirmModal
        open={confirm?.type === 'deleteAll'}
        title="Очистить все проекты?"
        message="Все проекты будут удалены без возможности восстановления."
        confirmLabel="Удалить всё"
        loading={actionLoading}
        onClose={() => setConfirm(null)}
        onConfirm={handleDeleteAllProjects}
      />
      <ConfirmModal
        open={confirm?.type === 'deleteAccount'}
        title="Удалить аккаунт?"
        message="Локальные данные будут очищены, сессия завершена. Данные на сервере останутся до полной реализации удаления аккаунта."
        confirmLabel="Удалить аккаунт"
        onClose={() => setConfirm(null)}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
};

export default SettingsSection;

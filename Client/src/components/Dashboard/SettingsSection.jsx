import { useState, useEffect, useRef } from 'react';
import { useAppSettings } from '../../context/AppSettingsContext';
import { authAPI } from '../../services/api';
import { ChevronDown, Check, Pencil } from 'lucide-react';

const EXPORT_FORMAT_OPTIONS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'png', label: 'PNG' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'svg', label: 'SVG' },
];

const EXPORT_QUALITY_OPTIONS = [
  { value: 'standard', label: 'Стандартное' },
  { value: 'high', label: 'Высокое' },
  { value: 'max', label: 'Максимальное' },
];

const loadStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
};

const persistUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

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
    <div className="shrink-0 w-full sm:w-auto sm:text-right">{children}</div>
  </div>
);

const fieldClass =
  'w-full bg-app-hover border border-app-border rounded-xl px-3 py-2.5 text-sm text-app-text outline-none focus:border-indigo-500 transition-colors';

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

const DropdownSelect = ({ value, onChange, options, disabled }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={ref} className="relative min-w-[160px]">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 bg-app-hover border border-app-border rounded-xl px-3 py-2.5 text-sm text-app-text outline-none focus:border-indigo-500 disabled:opacity-50"
      >
        <span className="font-medium">{selected?.label}</span>
        <ChevronDown className={`w-4 h-4 text-app-muted shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-app-surface border border-app-border-strong rounded-xl shadow-2xl overflow-hidden">
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-left transition-colors ${
                  active
                    ? 'bg-indigo-500/15 text-indigo-500 dark:text-indigo-400'
                    : 'text-app-text hover:bg-app-hover'
                }`}
              >
                <span className="font-medium">{opt.label}</span>
                {active && <Check className="w-4 h-4 shrink-0" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Select = ({ value, onChange, options }) => (
  <DropdownSelect value={value} onChange={onChange} options={options} />
);

const Btn = ({ children, onClick, variant = 'default', disabled, loading, className = '' }) => {
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
      className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {loading ? '…' : children}
    </button>
  );
};

const SettingsSection = () => {
  const { settings, updateSetting } = useAppSettings();
  const [user, setUser] = useState(loadStoredUser);
  const [nameForm, setNameForm] = useState(user.name || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameMsg, setNameMsg] = useState('');
  const [nameLoading, setNameLoading] = useState(false);
  const [pwdForm, setPwdForm] = useState({ newPassword: '', confirm: '' });
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    setNameForm(user.name || '');
  }, [user.name]);

  const startNameEdit = () => {
    setNameForm(user.name || '');
    setNameMsg('');
    setIsEditingName(true);
  };

  const cancelNameEdit = () => {
    setNameForm(user.name || '');
    setIsEditingName(false);
    setNameMsg('');
  };

  const handleNameSave = async () => {
    setIsEditingName(false);
    setNameMsg('');
    const trimmed = nameForm.trim();
    if (!trimmed || trimmed === user.name) {
      setNameForm(user.name || '');
      return;
    }
    if (trimmed.length < 2) {
      setNameMsg('Имя должно быть не менее 2 символов');
      setNameForm(user.name || '');
      return;
    }
    setNameLoading(true);
    try {
      const updated = await authAPI.updateProfile(trimmed);
      const nextUser = { ...user, ...updated };
      setUser(nextUser);
      persistUser(nextUser);
      setNameForm(updated.name);
      setNameMsg('Имя успешно сохранено');
    } catch (err) {
      setNameMsg(err.message || 'Не удалось сохранить имя');
      setNameForm(user.name || '');
    } finally {
      setNameLoading(false);
    }
  };

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
      await authAPI.changePassword(pwdForm.newPassword, pwdForm.confirm);
      setPwdMsg('Пароль успешно изменён');
      setPwdForm({ newPassword: '', confirm: '' });
    } catch (err) {
      setPwdMsg(err.message || 'Не удалось сменить пароль');
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6 pb-8">
      <Section title="Профиль">
        <Row label="Имя пользователя" desc="Отображается как логин в системе">
          <div className="w-full sm:ml-auto sm:flex sm:flex-col sm:items-end">
            {isEditingName ? (
              <input
                autoFocus
                type="text"
                value={nameForm}
                onChange={(e) => setNameForm(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNameSave();
                  if (e.key === 'Escape') cancelNameEdit();
                }}
                disabled={nameLoading}
                className="bg-app-hover border border-indigo-500/50 rounded-lg px-2 py-1 text-sm font-semibold text-app-text outline-none w-full max-w-[240px] sm:text-right"
                autoComplete="username"
              />
            ) : (
              <button
                type="button"
                onClick={startNameEdit}
                disabled={nameLoading}
                className="inline-flex items-center gap-2 group disabled:opacity-50"
                title="Нажмите, чтобы изменить имя"
              >
                <span className="text-sm font-semibold text-app-text group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                  {user.name || '—'}
                </span>
                <Pencil className="w-3.5 h-3.5 text-app-muted group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors shrink-0" strokeWidth={2} />
              </button>
            )}
            {nameMsg && (
              <p className={`text-xs mt-2 sm:text-right ${nameMsg.includes('успешно') ? 'text-emerald-500' : 'text-rose-400 dark:text-rose-300'}`}>
                {nameMsg}
              </p>
            )}
          </div>
        </Row>

        <div className="pt-5 mt-1 border-t border-app-border">
          <div className="mb-5">
            <p className="text-sm font-semibold text-app-text">Смена пароля</p>
            <p className="text-xs text-app-muted mt-1">Новый пароль — не менее 8 символов</p>
          </div>

          <div className="grid gap-4 max-w-lg">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-app-muted mb-2 block">
                Новый пароль
              </label>
              <input
                type="password"
                placeholder="Введите новый пароль"
                value={pwdForm.newPassword}
                onChange={(e) => setPwdForm((f) => ({ ...f, newPassword: e.target.value }))}
                className={fieldClass}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-app-muted mb-2 block">
                Подтверждение
              </label>
              <input
                type="password"
                placeholder="Повторите новый пароль"
                value={pwdForm.confirm}
                onChange={(e) => setPwdForm((f) => ({ ...f, confirm: e.target.value }))}
                className={fieldClass}
                autoComplete="new-password"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
              <Btn variant="primary" onClick={handlePasswordChange} loading={pwdLoading}>
                Сохранить пароль
              </Btn>
              {pwdMsg && (
                <p className={`text-xs ${pwdMsg.includes('успешно') ? 'text-emerald-500' : 'text-rose-400 dark:text-rose-300'}`}>
                  {pwdMsg}
                </p>
              )}
            </div>
          </div>
        </div>
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
            options={EXPORT_FORMAT_OPTIONS}
          />
        </Row>
        <Row label="Качество экспорта">
          <Select
            value={settings.exportQuality}
            onChange={(v) => updateSetting('exportQuality', v)}
            options={EXPORT_QUALITY_OPTIONS}
          />
        </Row>
        <Row label="Встраивать шрифты в PDF">
          <Toggle checked={settings.embedFonts} onChange={(v) => updateSetting('embedFonts', v)} />
        </Row>
      </Section>
    </div>
  );
};

export default SettingsSection;

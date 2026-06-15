import { useState, useEffect, useRef } from 'react';
import { useAppSettings } from '../../context/AppSettingsContext';
import { authAPI } from '../../services/api';
import { ChevronDown, Check } from 'lucide-react';

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

const SettingsSection = () => {
  const { settings, updateSetting } = useAppSettings();
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  });
  const [pwdForm, setPwdForm] = useState({ newPassword: '', confirm: '' });
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

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

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Pencil, FileText, ChevronDown, Check } from 'lucide-react';
import { exportAPI, projectsAPI } from '../services/api';
import { getCachedProjectPreview } from '../utils/projectPreview';
import { useAppSettings } from '../context/AppSettingsContext';
import {
  exportClientImage,
  exportClientSvg,
  downloadDataUrl,
  downloadText,
  sanitizeFileName,
} from '../utils/clientExport';
import ThemeToggle from '../components/UI/ThemeToggle';

const DPI_PRESETS = [
  { id: 'web', dpi: 72, label: 'Для веба', desc: '72 DPI — лёгкий файл' },
  { id: 'print', dpi: 300, label: 'Для печати', desc: '300 DPI — высокое качество' },
];

const FORMAT_OPTIONS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'png', label: 'PNG' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'svg', label: 'SVG' },
];

const FormatSelect = ({ value, onChange, disabled }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = FORMAT_OPTIONS.find((f) => f.value === value);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={ref} className="relative mb-4">
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
          {FORMAT_OPTIONS.map((f) => {
            const active = f.value === value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => {
                  onChange(f.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-left transition-colors ${
                  active
                    ? 'bg-indigo-500/15 text-indigo-500 dark:text-indigo-400'
                    : 'text-app-text hover:bg-app-hover'
                }`}
              >
                <span className="font-medium">{f.label}</span>
                {active && <Check className="w-4 h-4 shrink-0" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ExportPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useAppSettings();
  const progressTimer = useRef(null);

  const fromDashboard = location.state?.from === 'dashboard';
  const backLabel = fromDashboard ? 'Вернуться в главное меню' : 'Вернуться в редактор';

  const [project, setProject] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const [exportFormat, setExportFormat] = useState('pdf');
  const [dpiPreset, setDpiPreset] = useState('print');
  const [colorProfile, setColorProfile] = useState('rgb');
  const [cropMarks, setCropMarks] = useState(false);
  const [bleeds, setBleeds] = useState(false);
  const [embedFonts, setEmbedFonts] = useState(true);

  const previewSrc = project?.previewUrl || getCachedProjectPreview(id);
  const dpi = DPI_PRESETS.find((p) => p.id === dpiPreset)?.dpi ?? 300;

  useEffect(() => {
    setEmbedFonts(settings.embedFonts);
  }, [settings.embedFonts]);

  useEffect(() => {
    const loadProject = async () => {
      if (!id || id === 'undefined') {
        setError('Некорректный ID проекта');
        return;
      }
      try {
        const data = await projectsAPI.getById(id);
        setProject(data);
        setProjectName(data.name || 'Без названия');
      } catch {
        setError('Проект не найден');
      }
    };
    if (id) loadProject();
  }, [id]);

  useEffect(() => () => {
    if (progressTimer.current) clearInterval(progressTimer.current);
  }, []);

  const handleBack = () => {
    if (fromDashboard) navigate('/dashboard');
    else navigate(`/editor/${id}`);
  };

  const startProgress = () => {
    setProgress(0);
    if (progressTimer.current) clearInterval(progressTimer.current);
    progressTimer.current = setInterval(() => {
      setProgress((p) => (p >= 92 ? p : p + Math.random() * 8 + 2));
    }, 400);
  };

  const stopProgress = (success) => {
    if (progressTimer.current) clearInterval(progressTimer.current);
    setProgress(success ? 100 : 0);
  };

  const saveProjectName = async () => {
    if (!project || !id) return;
    const trimmed = projectName.trim() || 'Без названия';
    setProjectName(trimmed);
    setIsEditingName(false);
    if (trimmed === project.name) return;
    try {
      await projectsAPI.savePreview(id, { name: trimmed, previewUrl: project.previewUrl });
      setProject((p) => ({ ...p, name: trimmed }));
    } catch {
      /* имя используется только для файла при ошибке сохранения */
    }
  };

  const buildExportOptions = () => ({
    dpi,
    colorProfile,
    cropMarks: exportFormat === 'pdf' ? cropMarks : false,
    bleeds,
    embedFonts,
  });

  const handleGenerate = async () => {
    if (!id || id === 'undefined' || !project) {
      setError('Ошибка: проект не найден');
      return;
    }

    setLoading(true);
    setStatus('generating');
    setError('');
    startProgress();

    const fileName = sanitizeFileName(projectName);
    const options = buildExportOptions();

    try {
      if (exportFormat === 'pdf') {
        await exportAPI.generatePDF(id, { fileName, options });
      } else if (exportFormat === 'svg') {
        const svg = await exportClientSvg(project, { bleeds });
        downloadText(svg, `${fileName}.svg`);
      } else {
        const dataUrl = await exportClientImage(project, {
          format: exportFormat,
          dpi,
          bleeds,
        });
        downloadDataUrl(dataUrl, `${fileName}.${fileExtension[exportFormat]}`);
      }
      stopProgress(true);
      setStatus('success');
    } catch (err) {
      stopProgress(false);
      setError(err?.message || 'Ошибка генерации');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const formatButtonLabel = {
    pdf: 'Подготовить PDF файл',
    png: 'Экспортировать PNG',
    jpeg: 'Экспортировать JPEG',
    svg: 'Экспортировать SVG',
  };

  const fileExtension = { pdf: 'pdf', png: 'png', jpeg: 'jpeg', svg: 'svg' };

  return (
    <div className="min-h-screen bg-app-bg text-app-text-secondary flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans transition-colors duration-200">
      <ThemeToggle className="fixed top-6 right-6 z-50" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-3xl z-10">
        <button
          type="button"
          onClick={handleBack}
          className="mb-8 flex items-center gap-2 text-app-muted hover:text-app-text transition-colors text-sm group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          {backLabel}
        </button>

        <div className="bg-app-surface border border-app-border rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
          <div className="grid md:grid-cols-[220px_1fr] gap-8 mb-8">
            <div className="flex flex-col items-center">
              <div className="w-full aspect-[1.1] rounded-2xl bg-slate-100 dark:bg-[#1a1a1e] border border-app-border overflow-hidden flex items-center justify-center shadow-inner">
                {previewSrc ? (
                  <img src={previewSrc} alt="" className="w-full h-full object-contain bg-white" />
                ) : (
                  <FileText className="w-12 h-12 text-app-muted opacity-40" strokeWidth={1.25} />
                )}
              </div>
              <p className="text-[10px] text-app-muted mt-3 text-center uppercase tracking-wider">
                {project?.width} × {project?.height} px
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-app-text mb-1">Экспорт публикации</h2>
              <p className="text-app-muted text-sm mb-5">Настройте параметры перед скачиванием</p>

              <div className="flex items-center gap-2 mb-4">
                {isEditingName ? (
                  <input
                    autoFocus
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    onBlur={saveProjectName}
                    onKeyDown={(e) => e.key === 'Enter' && saveProjectName()}
                    className="flex-1 bg-app-hover border border-indigo-500/50 rounded-xl px-3 py-2 text-sm font-semibold text-app-text outline-none"
                  />
                ) : (
                  <>
                    <span className="text-lg font-semibold text-app-text truncate">
                      {projectName || 'Загрузка…'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(true)}
                      className="p-2 rounded-lg hover:bg-app-hover text-app-muted hover:text-indigo-500 transition-colors"
                      title="Переименовать"
                    >
                      <Pencil className="w-4 h-4" strokeWidth={2} />
                    </button>
                  </>
                )}
              </div>

              <label className="text-[10px] font-bold text-app-muted uppercase tracking-widest block mb-2">Формат</label>
              <FormatSelect
                value={exportFormat}
                onChange={setExportFormat}
                disabled={loading}
              />
            </div>
          </div>

          <div className="border-t border-app-border pt-8 space-y-6">
            <div>
              <h3 className="text-[10px] font-black text-app-muted uppercase tracking-[0.25em] mb-4">
                Настройки для типографии
              </h3>

              <p className="text-[10px] font-bold text-app-muted uppercase tracking-widest mb-3">Качество (DPI)</p>
              <div className="grid sm:grid-cols-2 gap-3 mb-5">
                {DPI_PRESETS.map((preset) => (
                  <label
                    key={preset.id}
                    className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                      dpiPreset === preset.id
                        ? 'border-indigo-500/50 bg-indigo-500/10'
                        : 'border-app-border bg-app-hover hover:bg-app-hover-strong'
                    }`}
                  >
                    <input
                      type="radio"
                      name="dpi"
                      checked={dpiPreset === preset.id}
                      onChange={() => setDpiPreset(preset.id)}
                      disabled={loading}
                      className="mt-1 accent-indigo-600"
                    />
                    <div>
                      <span className="block text-sm font-semibold text-app-text">{preset.label}</span>
                      <span className="block text-xs text-app-muted mt-0.5">{preset.desc}</span>
                    </div>
                  </label>
                ))}
              </div>

              <p className="text-[10px] font-bold text-app-muted uppercase tracking-widest mb-3">Цветовой профиль</p>
              <div className="flex gap-2 mb-5">
                {[
                  { id: 'rgb', label: 'RGB', desc: 'Для экранов' },
                  { id: 'cmyk', label: 'CMYK', desc: 'Для типографии' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    disabled={loading || (exportFormat !== 'pdf' && mode.id === 'cmyk')}
                    onClick={() => setColorProfile(mode.id)}
                    className={`flex-1 p-3 rounded-xl border text-left transition-all ${
                      colorProfile === mode.id
                        ? 'border-indigo-500/50 bg-indigo-500/10'
                        : 'border-app-border bg-app-hover hover:bg-app-hover-strong'
                    } disabled:opacity-50`}
                  >
                    <span className="block text-sm font-bold text-app-text">{mode.label}</span>
                    <span className="block text-[10px] text-app-muted">{mode.desc}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-3 mb-5">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bleeds}
                    onChange={(e) => setBleeds(e.target.checked)}
                    disabled={loading}
                    className="w-4 h-4 rounded accent-indigo-600"
                  />
                  <span className="text-sm text-app-text">Добавить вылеты под обрез (Bleeds)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cropMarks}
                    onChange={(e) => setCropMarks(e.target.checked)}
                    disabled={loading || exportFormat !== 'pdf'}
                    className="w-4 h-4 rounded accent-indigo-600"
                  />
                  <span className={`text-sm ${exportFormat === 'pdf' ? 'text-app-text' : 'text-app-muted'}`}>
                    Добавить метки реза (Crop Marks)
                    {exportFormat !== 'pdf' && ' — только PDF'}
                  </span>
                </label>
                {exportFormat === 'pdf' && (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={embedFonts}
                      onChange={(e) => setEmbedFonts(e.target.checked)}
                      disabled={loading}
                      className="w-4 h-4 rounded accent-indigo-600"
                    />
                    <span className="text-sm text-app-text">Встраивать шрифты в PDF</span>
                  </label>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs">
              {error}
            </div>
          )}

          {status === 'success' && (
            <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs font-medium">
              Файл успешно сгенерирован и загружен!
            </div>
          )}

          {loading && (
            <div className="mt-6">
              <div className="flex justify-between text-[10px] font-bold text-app-muted uppercase tracking-wider mb-2">
                <span>Генерация макета…</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 rounded-full bg-app-hover overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-8 space-y-3">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading || !project}
              className={`w-full py-4 rounded-2xl font-bold text-sm transition-all shadow-lg ${
                loading
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20 active:scale-[0.98]'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {formatButtonLabel[exportFormat]}…
                </div>
              ) : (
                formatButtonLabel[exportFormat]
              )}
            </button>

            {status === 'success' && (
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="w-full py-4 rounded-2xl font-bold text-sm text-app-muted hover:text-app-text hover:bg-app-hover transition-all"
              >
                На главную
              </button>
            )}
          </div>
        </div>

        <p className="mt-8 text-center text-app-muted text-[11px] leading-relaxed uppercase tracking-wider">
          Генерация может занять до 15 секунд
          <br />
          в зависимости от количества слоёв и выбранного DPI
        </p>
      </div>
    </div>
  );
};

export default ExportPage;

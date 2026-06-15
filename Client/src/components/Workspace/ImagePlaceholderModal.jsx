import { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, Link2, Upload } from 'lucide-react';
import { fillImagePlaceholder, fillImagePlaceholderFromFile } from '../../utils/imagePlaceholder';

const ImagePlaceholderModal = ({ open, placeholder, canvas, onClose, onSuccess }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setUrl('');
    setError('');
    setLoading(false);
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open, placeholder]);

  if (!open || !placeholder) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      setError('Введите ссылку на изображение');
      return;
    }
    if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith('data:image')) {
      setError('Ссылка должна начинаться с http:// или https://');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await fillImagePlaceholder(canvas, placeholder, trimmed);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(
        err?.message ||
          'Не удалось загрузить изображение. Проверьте ссылку или загрузите файл с компьютера.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      await fillImagePlaceholderFromFile(canvas, placeholder, file);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err?.message || 'Не удалось загрузить файл');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-app-overlay backdrop-blur-md flex items-center justify-center z-[500] p-4">
      <div className="bg-app-surface border border-app-border-strong rounded-[2rem] w-full max-w-[440px] shadow-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 flex items-center justify-center text-indigo-400">
            <ImageIcon className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-app-text">Вставить изображение</h2>
            <p className="text-xs text-app-muted mt-0.5">Ссылка или файл с компьютера</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-app-muted uppercase tracking-widest flex items-center gap-1.5 mb-2">
              <Link2 className="w-3.5 h-3.5" /> Ссылка на изображение
            </label>
            <input
              ref={inputRef}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              disabled={loading}
              className="w-full bg-app-hover border border-app-border rounded-xl px-4 py-3 text-sm text-app-text outline-none focus:border-indigo-500 disabled:opacity-50"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 rounded-xl font-bold text-[10px] uppercase tracking-wider bg-app-hover hover:bg-app-hover-strong text-app-text-secondary transition-all disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[1.4] py-3 rounded-xl font-bold text-[10px] uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-50"
            >
              {loading ? 'Загрузка…' : 'Вставить'}
            </button>
          </div>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-app-border" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
            <span className="bg-app-surface px-3 text-app-muted">или</span>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-app-border bg-app-hover hover:bg-app-hover-strong text-sm font-semibold text-app-text transition-all disabled:opacity-50"
        >
          <Upload className="w-4 h-4 text-app-muted" />
          Загрузить с компьютера
        </button>
      </div>
    </div>
  );
};

export default ImagePlaceholderModal;

import { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { designPresetsAPI } from '../../services/api';
import { NEWSPAPER_TEMPLATES } from '../../utils/newspaperTemplates';
import { getBuiltinTemplatePreview, getPresetTemplatePreview } from '../../utils/templatePreview';

const TemplatesSection = ({ onUseTemplate }) => {
  const [savedPresets, setSavedPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [builtinPreviews, setBuiltinPreviews] = useState({});
  const [presetPreviews, setPresetPreviews] = useState({});

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await designPresetsAPI.getMine();
        if (!cancelled) setSavedPresets(data);
      } catch {
        if (!cancelled) setSavedPresets([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadBuiltin = async () => {
      const entries = await Promise.all(
        NEWSPAPER_TEMPLATES.filter((t) => t.id !== 'blank').map(async (tpl) => {
          const src = await getBuiltinTemplatePreview(tpl.id);
          return [tpl.id, src];
        })
      );
      if (!cancelled) setBuiltinPreviews(Object.fromEntries(entries));
    };
    loadBuiltin();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadPresets = async () => {
      const entries = await Promise.all(
        savedPresets.map(async (preset) => {
          const src = preset.thumbnail || (await getPresetTemplatePreview(preset.id, preset.designSettings));
          return [preset.id, src];
        })
      );
      if (!cancelled) setPresetPreviews(Object.fromEntries(entries));
    };
    if (savedPresets.length) loadPresets();
    else if (!cancelled) setPresetPreviews({});
    return () => { cancelled = true; };
  }, [savedPresets]);

  const builtinTemplates = NEWSPAPER_TEMPLATES.filter((t) => t.id !== 'blank');

  if (loading && !savedPresets.length && !builtinTemplates.length) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="aspect-[1.1] bg-app-hover rounded-[3rem] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <section>
        <h2 className="text-[10px] font-black text-app-muted uppercase tracking-[0.3em] mb-6">Готовые макеты</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {builtinTemplates.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onUseTemplate({ templateId: tpl.id })}
              className="group text-left bg-app-surface border border-app-border rounded-[3rem] p-7 hover:bg-app-elevated hover:border-app-border-strong transition-all duration-500 shadow-xl dark:shadow-black/50"
            >
              <div className="aspect-[1.1] bg-slate-100 dark:bg-[#1a1a1e] rounded-[2rem] mb-6 overflow-hidden flex items-center justify-center ring-1 ring-app-border-strong">
                {builtinPreviews[tpl.id] ? (
                  <img
                    src={builtinPreviews[tpl.id]}
                    alt=""
                    className="w-full h-full object-contain rounded-xl bg-white"
                  />
                ) : (
                  <div className="w-full h-full animate-pulse bg-app-hover" />
                )}
              </div>
              <h3 className="text-lg font-bold text-app-text mb-1 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                {tpl.name}
              </h3>
              <p className="text-[10px] font-bold text-app-muted uppercase tracking-[0.15em]">{tpl.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {savedPresets.length > 0 && (
        <section>
          <h2 className="text-[10px] font-black text-app-muted uppercase tracking-[0.3em] mb-6">Мои сохранённые шаблоны</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {savedPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onUseTemplate({ presetId: preset.id })}
                className="group text-left bg-app-surface border border-app-border rounded-[3rem] p-7 hover:bg-app-elevated hover:border-violet-500/30 transition-all duration-500 shadow-xl dark:shadow-black/50"
              >
                <div className="aspect-[1.1] bg-slate-100 dark:bg-[#1a1a1e] rounded-[2rem] mb-6 overflow-hidden flex items-center justify-center ring-1 ring-app-border-strong">
                  {presetPreviews[preset.id] ? (
                    <img
                      src={presetPreviews[preset.id]}
                      alt=""
                      className="w-full h-full object-contain rounded-xl bg-white"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500">
                      <Bookmark className="w-6 h-6" strokeWidth={1.5} />
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-bold text-app-text mb-1 group-hover:text-violet-500 transition-colors truncate">
                  {preset.name}
                </h3>
                <p className="text-[10px] font-bold text-app-muted uppercase tracking-[0.15em] truncate">
                  {preset.description || 'Мой сохранённый макет'}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default TemplatesSection;

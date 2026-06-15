import { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { fabric } from 'fabric';
import { applyNewspaperTemplate, NEWSPAPER_TEMPLATES } from '../../utils/newspaperTemplates';
import { designPresetsAPI } from '../../services/api';
import {
  getBuiltinTemplatePreview,
  getPresetTemplatePreview,
  cachePresetTemplatePreview
} from '../../utils/templatePreview';
import TemplatePreviewThumb from './TemplatePreviewThumb';
import {
  Grid,
  ChevronRight,
  Type,
  Heading2,
  AlignLeft,
  Square,
  Circle,
  Triangle,
  Image,
  Trash2
} from 'lucide-react';

const BUILTIN_TEMPLATES = NEWSPAPER_TEMPLATES.filter((t) => t.id !== 'blank');

const Toolbar = () => {
  const { canvas } = useWorkspace();
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [savedPresets, setSavedPresets] = useState([]);
  const [presetsLoading, setPresetsLoading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState({});
  const [previewsLoading, setPreviewsLoading] = useState(false);

  useEffect(() => {
    if (!templatesOpen) return;
    let cancelled = false;
    const loadPresets = async () => {
      setPresetsLoading(true);
      try {
        const data = await designPresetsAPI.getMine();
        if (!cancelled) setSavedPresets(data);
      } catch {
        if (!cancelled) setSavedPresets([]);
      } finally {
        if (!cancelled) setPresetsLoading(false);
      }
    };
    loadPresets();
    return () => { cancelled = true; };
  }, [templatesOpen]);

  useEffect(() => {
    if (!templatesOpen) return;
    let cancelled = false;

    const loadPreviews = async () => {
      setPreviewsLoading(true);
      const next = {};

      await Promise.all(
        BUILTIN_TEMPLATES.map(async (tpl) => {
          const url = await getBuiltinTemplatePreview(tpl.id);
          if (url) next[`builtin-${tpl.id}`] = url;
        })
      );

      await Promise.all(
        savedPresets.map(async (preset) => {
          if (preset.thumbnail) {
            next[`preset-${preset.id}`] = preset.thumbnail;
            cachePresetTemplatePreview(preset.id, preset.thumbnail);
            return;
          }
          try {
            const full = await designPresetsAPI.getById(preset.id);
            const url = await getPresetTemplatePreview(preset.id, full?.designSettings);
            if (url) next[`preset-${preset.id}`] = url;
          } catch {
            /* skip */
          }
        })
      );

      if (!cancelled) {
        setPreviewUrls((prev) => ({ ...prev, ...next }));
        setPreviewsLoading(false);
      }
    };

    loadPreviews();
    return () => { cancelled = true; };
  }, [templatesOpen, savedPresets]);

  const toggleGrid = () => {
    if (!canvas) return;
    const existingLines = canvas.getObjects().filter((o) => o.isGridLine);
    if (existingLines.length > 0) {
      existingLines.forEach((line) => canvas.remove(line));
      canvas.renderAll();
      return;
    }
    const cw = canvas.width / canvas.getZoom();
    const ch = canvas.height / canvas.getZoom();

    const columns = 4;
    const rows = 5;
    const margin = Math.round(cw * 0.05);
    const gutter = Math.round(cw * 0.02);
    const colWidth = (cw - margin * 2 - gutter * (columns - 1)) / columns;
    const rowHeight = (ch - margin * 2 - gutter * (rows - 1)) / rows;

    const lineOptions = {
      stroke: '#0ea5e9',
      strokeWidth: 1.5 / canvas.getZoom(),
      selectable: false,
      evented: false,
      excludeFromExport: true,
      isGridLine: true,
      opacity: 0.6
    };
    canvas.add(new fabric.Line([margin, 0, margin, ch], lineOptions));
    canvas.add(new fabric.Line([cw - margin, 0, cw - margin, ch], lineOptions));
    canvas.add(new fabric.Line([0, margin, cw, margin], lineOptions));
    canvas.add(new fabric.Line([0, ch - margin, cw, ch - margin], lineOptions));

    for (let i = 1; i < columns; i++) {
      const x = margin + i * colWidth + (i - 1) * gutter;
      canvas.add(new fabric.Line([x, margin, x, ch - margin], lineOptions));
      canvas.add(new fabric.Line([x + gutter, margin, x + gutter, ch - margin], lineOptions));
    }
    for (let i = 1; i < rows; i++) {
      const y = margin + i * rowHeight + (i - 1) * gutter;
      canvas.add(new fabric.Line([margin, y, cw - margin, y], lineOptions));
      canvas.add(new fabric.Line([margin, y + gutter, cw - margin, y + gutter], lineOptions));
    }
    canvas.renderAll();
  };

  const executeApplyBuiltin = (type) => {
    applyNewspaperTemplate(canvas, type);
    setTemplatesOpen(false);
  };

  const executeApplySaved = async (presetId) => {
    const preset = await designPresetsAPI.getById(presetId);
    if (!preset?.designSettings || !canvas) return;
    canvas.clear();
    canvas.loadFromJSON(preset.designSettings, () => {
      canvas.renderAll();
    });
    setTemplatesOpen(false);
  };

  const applyBuiltin = (type, name) => {
    if (!canvas) return;
    setConfirmConfig({
      message: `Применить шаблон «${name}»? Текущий холст будет очищен.`,
      onConfirm: () => executeApplyBuiltin(type)
    });
  };

  const applySaved = (presetId, name) => {
    if (!canvas) return;
    setConfirmConfig({
      message: `Применить шаблон «${name}»? Текущий холст будет очищен.`,
      onConfirm: () => executeApplySaved(presetId)
    });
  };

  const addHeadline = () => {
    if (!canvas) return;
    const cw = canvas.width / canvas.getZoom();
    const ch = canvas.height / canvas.getZoom();
    const text = new fabric.Textbox('ГЛАВНЫЙ ЗАГОЛОВОК', {
      left: cw / 2,
      top: ch / 6,
      width: cw - 120,
      fontFamily: 'Times New Roman',
      fontSize: Math.round(cw * 0.085),
      fontWeight: 'bold',
      fill: '#111111',
      textAlign: 'center',
      originX: 'center',
      originY: 'top'
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const addSubhead = () => {
    if (!canvas) return;
    const cw = canvas.width / canvas.getZoom();
    const ch = canvas.height / canvas.getZoom();
    const text = new fabric.Textbox('Заголовок колонки', {
      left: cw / 2,
      top: ch / 3,
      width: Math.round(cw * 0.28),
      fontFamily: 'Arial',
      fontSize: Math.round(cw * 0.035),
      fontWeight: 'bold',
      fill: '#111111',
      textAlign: 'left',
      originX: 'center',
      originY: 'top'
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const addBodyText = () => {
    if (!canvas) return;
    const cw = canvas.width / canvas.getZoom();
    const ch = canvas.height / canvas.getZoom();
    const text = new fabric.Textbox(
      'Таким образом, постоянное информационно-пропагандистское обеспечение нашей текущей деятельности требует от нас комплексного анализа и глубокой проработки форм развития.',
      {
        left: cw / 2,
        top: ch / 2,
        width: Math.round(cw * 0.28),
        fontFamily: 'Times New Roman',
        fontSize: Math.round(cw * 0.0195),
        lineHeight: 1.25,
        fill: '#333333',
        textAlign: 'justify',
        originX: 'center',
        originY: 'top'
      }
    );
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const addRectangle = () => {
    if (!canvas) return;
    const cw = canvas.width / canvas.getZoom();
    const ch = canvas.height / canvas.getZoom();
    const rect = new fabric.Rect({
      left: cw / 2,
      top: ch / 2,
      width: Math.round(cw * 0.25),
      height: Math.round(ch * 0.15),
      fill: '#818cf8',
      rx: 16,
      ry: 16,
      originX: 'center',
      originY: 'top'
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
  };

  const addCircle = () => {
    if (!canvas) return;
    const cw = canvas.width / canvas.getZoom();
    const ch = canvas.height / canvas.getZoom();
    const circle = new fabric.Circle({
      left: cw / 2,
      top: ch / 2,
      radius: Math.round(cw * 0.1),
      fill: '#818cf8',
      originX: 'center',
      originY: 'top'
    });
    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.renderAll();
  };

  const addTriangle = () => {
    if (!canvas) return;
    const cw = canvas.width / canvas.getZoom();
    const ch = canvas.height / canvas.getZoom();
    const triangle = new fabric.Triangle({
      left: cw / 2,
      top: ch / 2,
      width: Math.round(cw * 0.2),
      height: Math.round(cw * 0.2),
      fill: '#818cf8',
      originX: 'center',
      originY: 'top'
    });
    canvas.add(triangle);
    canvas.setActiveObject(triangle);
    canvas.renderAll();
  };

  const addImage = () => {
    if (!canvas) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        fabric.Image.fromURL(event.target.result, (img) => {
          if (!img || !canvas) return;
          const cw = canvas.width / canvas.getZoom();
          const ch = canvas.height / canvas.getZoom();
          img.scaleToWidth(Math.round(cw * 0.3));
          img.set({ left: cw / 2, top: ch / 2, originX: 'center', originY: 'top' });
          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.renderAll();
        });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const clearCanvas = () => {
    if (!canvas) return;
    setConfirmConfig({
      message: 'Вы уверены, что хотите полностью очистить холст? Все элементы будут удалены.',
      onConfirm: () => {
        canvas.clear();
        canvas.setBackgroundColor('#ffffff', canvas.renderAll.bind(canvas));
      }
    });
  };

  return (
    <div className="relative h-full w-full overflow-visible">
      <div className="flex flex-col gap-2 p-3 bg-app-bg select-none w-full items-center overflow-visible">
        <button
          onClick={toggleGrid}
          className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-all group w-12 h-12 flex items-center justify-center shrink-0"
          title="Сетка (Направляющие)"
        >
          <Grid className="w-5 h-5 mx-auto group-hover:scale-110 transition-transform shrink-0" strokeWidth={1.5} />
        </button>

        <div className="h-[1px] w-10 mx-auto bg-white/10 my-2 shrink-0" />

        {/* Кнопка > на месте бывших шаблонных кнопок + выезжающая панель */}
        <div className="relative w-full flex justify-center overflow-visible shrink-0">
          <button
            type="button"
            onClick={() => setTemplatesOpen((open) => !open)}
            className={`p-3 rounded-xl border transition-all w-12 h-12 flex items-center justify-center ${
              templatesOpen
                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400'
                : 'border-app-border bg-app-hover hover:bg-app-hover-strong text-slate-400 hover:text-indigo-400'
            }`}
            title={templatesOpen ? 'Свернуть шаблоны' : 'Шаблоны'}
            aria-expanded={templatesOpen}
          >
            <ChevronRight
              className={`w-5 h-5 transition-transform duration-300 ease-in-out ${
                templatesOpen ? 'rotate-180' : ''
              }`}
              strokeWidth={2}
            />
          </button>

          <div
            className={`absolute left-[calc(100%+4px)] top-0 z-[100] flex w-[300px] max-h-[min(70vh,calc(100vh-10rem))] flex-col rounded-r-2xl border border-app-border border-l-0 bg-app-surface shadow-2xl transition-[transform,opacity] duration-300 ease-in-out origin-left ${
              templatesOpen
                ? 'translate-x-0 opacity-100 pointer-events-auto'
                : '-translate-x-3 opacity-0 pointer-events-none'
            }`}
            aria-hidden={!templatesOpen}
          >
            <div className="shrink-0 border-b border-app-border px-4 py-3">
              <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-app-muted">Шаблоны</h3>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 space-y-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-app-muted mb-2 px-1">Встроенные</p>
                <div className="space-y-2">
                  {BUILTIN_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => applyBuiltin(tpl.id, tpl.name)}
                        className="w-full flex items-start gap-3 p-3 rounded-xl border border-app-border bg-app-hover hover:bg-app-hover-strong hover:border-indigo-500/30 text-left transition-all"
                      >
                        <TemplatePreviewThumb
                          src={previewUrls[`builtin-${tpl.id}`]}
                          loading={previewsLoading && !previewUrls[`builtin-${tpl.id}`]}
                        />
                        <div className="min-w-0">
                          <span className="block text-xs font-bold text-app-text">{tpl.name}</span>
                          <span className="block text-[10px] text-app-muted mt-0.5 leading-snug">{tpl.desc}</span>
                        </div>
                      </button>
                    ))}
                </div>
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-app-muted mb-2 px-1">Мои сохранённые</p>
                {presetsLoading && (
                  <p className="text-[10px] text-app-muted text-center py-3">Загрузка…</p>
                )}
                {!presetsLoading && savedPresets.length === 0 && (
                  <p className="text-[10px] text-app-muted text-center py-3 px-2 leading-relaxed">
                    Нет сохранённых шаблонов. Создайте пресет в редакторе.
                  </p>
                )}
                {!presetsLoading && savedPresets.length > 0 && (
                  <div className="space-y-2">
                    {savedPresets.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applySaved(preset.id, preset.name)}
                        className="w-full flex items-start gap-3 p-3 rounded-xl border border-app-border bg-app-hover hover:bg-app-hover-strong hover:border-violet-500/30 text-left transition-all"
                      >
                        <TemplatePreviewThumb
                          src={previewUrls[`preset-${preset.id}`] || preset.thumbnail}
                          loading={previewsLoading && !previewUrls[`preset-${preset.id}`] && !preset.thumbnail}
                        />
                        <div className="min-w-0">
                          <span className="block text-xs font-bold text-app-text truncate">{preset.name}</span>
                          <span className="block text-[10px] text-app-muted mt-0.5 leading-snug truncate">
                            {preset.description || 'Мой макет'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="h-[1px] w-10 mx-auto bg-white/10 my-2 shrink-0" />

        <div className="flex flex-col gap-1 items-center w-full overflow-y-auto custom-scrollbar max-h-[calc(100vh-14rem)]">
          <button onClick={addHeadline} className="p-3 rounded-xl hover:bg-white/10 text-slate-400 hover:text-indigo-400 transition-all group flex items-center justify-center w-12 h-12" title="Добавить главный заголовок">
            <Type className="w-5 h-5 group-hover:scale-110 transition-transform shrink-0" strokeWidth={1.75} />
          </button>
          <button onClick={addSubhead} className="p-3 rounded-xl hover:bg-white/10 text-slate-400 hover:text-indigo-400 transition-all group flex items-center justify-center w-12 h-12" title="Добавить подзаголовок колонки">
            <Heading2 className="w-5 h-5 group-hover:scale-110 transition-transform shrink-0" strokeWidth={1.75} />
          </button>
          <button onClick={addBodyText} className="p-3 rounded-xl hover:bg-white/10 text-slate-400 hover:text-indigo-400 transition-all group flex items-center justify-center w-12 h-12" title="Добавить статью / текстовую колонку">
            <AlignLeft className="w-5 h-5 group-hover:scale-110 transition-transform shrink-0" strokeWidth={1.75} />
          </button>

          <div className="h-[1px] w-10 mx-auto bg-white/10 my-2 shrink-0" />

          <button onClick={addRectangle} className="p-3 rounded-xl hover:bg-white/10 text-slate-400 hover:text-indigo-400 transition-all w-12 h-12 flex items-center justify-center group" title="Добавить прямоугольник">
            <Square className="w-5 h-5 group-hover:scale-110 transition-transform shrink-0" strokeWidth={1.75} />
          </button>
          <button onClick={addCircle} className="p-3 rounded-xl hover:bg-white/10 text-slate-400 hover:text-indigo-400 transition-all w-12 h-12 flex items-center justify-center group" title="Добавить круг">
            <Circle className="w-5 h-5 group-hover:scale-110 transition-transform shrink-0" strokeWidth={1.75} />
          </button>
          <button onClick={addTriangle} className="p-3 rounded-xl hover:bg-white/10 text-slate-400 hover:text-indigo-400 transition-all w-12 h-12 flex items-center justify-center group" title="Добавить треугольник">
            <Triangle className="w-5 h-5 group-hover:scale-110 transition-transform shrink-0" strokeWidth={1.75} />
          </button>
          <button onClick={addImage} className="p-3 rounded-xl hover:bg-white/10 text-slate-400 hover:text-indigo-400 transition-all w-12 h-12 flex items-center justify-center group" title="Загрузить изображение">
            <Image className="w-5 h-5 group-hover:scale-110 transition-transform shrink-0" strokeWidth={1.75} />
          </button>

          <div className="h-[1px] w-10 mx-auto bg-white/10 my-2 shrink-0" />

          <button onClick={clearCanvas} className="p-3 rounded-xl hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-all w-12 h-12 flex items-center justify-center group shrink-0" title="Полностью очистить страницу">
            <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform shrink-0" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {confirmConfig && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-[9999]">
          <div className="bg-app-bg border border-white/10 p-6 rounded-2xl w-[340px] shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="text-base">⚠️</span>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Подтверждение</h3>
            </div>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">{confirmConfig.message}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmConfig(null)}
                className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-[11px] uppercase tracking-wider text-slate-300 border border-app-border transition-all"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmConfig.onConfirm();
                  setConfirmConfig(null);
                }}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all shadow-md shadow-indigo-600/10"
              >
                Да, уверен
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Toolbar;

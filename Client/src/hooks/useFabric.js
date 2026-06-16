import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { useWorkspace } from '../context/WorkspaceContext';
import { canvasToHistoryJSON, loadHistoryOntoCanvas, restoreCanvasViewport } from '../utils/projectPreview';
import { copyCanvasObjects, pasteCanvasObjects, isCanvasShortcutBlocked, hasCanvasClipboard } from '../utils/canvasClipboard';

const SCROLL_PAD = 48;

export const useFabric = (canvasRef, containerRef, width = 1200, height = 1700, scrollContentRef = null) => {
  const { setCanvas, updateSelectedObject } = useWorkspace();
  const initRef = useRef(false);
  const canvasInstance = useRef(null);

  const historyStack = useRef([]);
  const historyIndex = useRef(-1);
  const isHandlingHistory = useRef(false);
  const saveTimeout = useRef(null);

  // Хранилище для живых размеров, защищающее от устаревших замыканий (Stale Closures)
  const dimensionsRef = useRef({ width, height });
  useEffect(() => {
    dimensionsRef.current = { width, height };
  }, [width, height]);

  // ==========================================
  // 1. ИНИЦИАЛИЗАЦИЯ ХОЛСТА, ИСТОРИЯ И ЛОГИКА ФИГУР
  // ==========================================
  useEffect(() => {
    if (!canvasRef.current || initRef.current) return;
    initRef.current = true;

    fabric.Object.prototype.objectCaching = false;

    const canvas = new fabric.Canvas(canvasRef.current, {
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      selection: true,
      selectionColor: 'rgba(79, 70, 229, 0.12)',
      selectionBorderColor: 'rgba(79, 70, 229, 0.85)',
      selectionLineWidth: 1.5,
    });

    canvasInstance.current = canvas;
    setCanvas(canvas);

    const handleSelection = () => {
      updateSelectedObject(canvas.getActiveObject() || null);
    };
    const handleCleared = () => updateSelectedObject(null);

    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', handleCleared);

    // --- ИСТОРИЯ (Undo / Redo) ---
    const saveState = () => {
      if (isHandlingHistory.current) return;
      clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        if (!canvas) return;
        const json = canvasToHistoryJSON(canvas);
        if (!json || (historyIndex.current >= 0 && historyStack.current[historyIndex.current] === json)) return;
        if (historyIndex.current < historyStack.current.length - 1) {
          historyStack.current = historyStack.current.slice(0, historyIndex.current + 1);
        }
        historyStack.current.push(json);
        historyIndex.current++;
        if (historyStack.current.length > 20) {
          historyStack.current.shift();
          historyIndex.current--;
        }
      }, 100);
    };

    canvas.on('object:added', (e) => {
      if (e.target?.isGuideLine || e.target?.excludeFromExport || e.target?.isGridLine) return;
      saveState();
    });
    canvas.on('object:removed', (e) => {
      if (e.target?.isGuideLine || e.target?.excludeFromExport || e.target?.isGridLine) return;
      saveState();
    });

    const applyHistoryStep = (index) => {
      const { width: pageW, height: pageH } = dimensionsRef.current;
      isHandlingHistory.current = true;
      loadHistoryOntoCanvas(canvas, historyStack.current[index], pageW, pageH, () => {
        updateSelectedObject(null);
        isHandlingHistory.current = false;
        containerRef.current?.dispatchEvent(new CustomEvent('canvas-layout'));
      });
    };

    const undo = () => {
      if (historyIndex.current > 0) {
        historyIndex.current--;
        applyHistoryStep(historyIndex.current);
      }
    };

    const redo = () => {
      if (historyIndex.current < historyStack.current.length - 1) {
        historyIndex.current++;
        applyHistoryStep(historyIndex.current);
      }
    };

    // --- ГОРЯЧИЕ КЛАВИШИ ---
    const handleKeyDown = async (e) => {
      if (isCanvasShortcutBlocked(canvas)) return;

      const activeObj = canvas.getActiveObject();
      if (activeObj?.isEditing) return;
      
      if (e.ctrlKey || e.metaKey) {
        if (e.code === 'KeyZ') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
        if (e.code === 'KeyY') { e.preventDefault(); redo(); return; }
        if (e.code === 'KeyC') {
          const copied = copyCanvasObjects(canvas);
          if (copied) e.preventDefault();
          return;
        }
        if (e.code === 'KeyV') {
          if (!hasCanvasClipboard()) return;
          e.preventDefault();
          const pasted = await pasteCanvasObjects(canvas);
          if (pasted) updateSelectedObject(canvas.getActiveObject() || null);
          return;
        }
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (activeObj && activeObj.isEditing) return;

        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length > 0) {
          e.preventDefault(); 
          activeObjects.forEach(obj => canvas.remove(obj));
          canvas.discardActiveObject();
          canvas.renderAll();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);

    // --- МОДИФИКАЦИЯ РАЗМЕРОВ И ДИНАМИЧЕСКИЕ БАРЬЕРЫ КРАЕВ ---
    const handleObjectModified = (e) => {
      const obj = e.target;
      if (!obj) return;

      if (obj.type === 'textbox' || obj.type === 'i-text') {
        if (obj.scaleX !== 1 || obj.scaleY !== 1) {
          obj.set({ width: Math.max(1, obj.width * obj.scaleX), fontSize: Math.max(1, Math.round(obj.fontSize * obj.scaleY)), scaleX: 1, scaleY: 1 });
        }
      }
      if (obj.type === 'rect') {
        if (obj.scaleX !== 1 || obj.scaleY !== 1) {
          obj.set({ width: Math.max(1, obj.width * obj.scaleX), height: Math.max(1, Math.round(obj.height * obj.scaleY)), scaleX: 1, scaleY: 1 });
        }
      }

      // Берем живые размеры
      const currentWidth = dimensionsRef.current.width;
      const currentHeight = dimensionsRef.current.height;
      const objW = obj.getScaledWidth();
      const objH = obj.getScaledHeight();
      const isCenterX = obj.originX === 'center';
      const isCenterY = obj.originY === 'center';

      const minLeft = isCenterX ? objW / 2 : 0;
      const maxLeft = isCenterX ? currentWidth - objW / 2 : currentWidth - objW;
      const minTop = isCenterY ? objH / 2 : 0;
      const maxTop = isCenterY ? currentHeight - objH / 2 : currentHeight - objH;

      if (obj.left < minLeft) obj.left = minLeft;
      if (obj.left > maxLeft) obj.left = maxLeft;
      if (obj.top < minTop) obj.top = minTop;
      if (obj.top > maxTop) obj.top = maxTop;

      obj.setCoords();
      canvas.renderAll();
      saveState();
    };
    canvas.on('object:modified', handleObjectModified);


    
    // --- НАПРАВЛЯЮЩИЕ, МАГНИТЫ И ДИНАМИЧЕСКИЕ ГРАНИЦЫ ---
    const snapZone = 8; 
    const margin = 60; 

    const drawGuide = (coords) => {
      return new fabric.Line(coords, {
        stroke: '#ec4899', 
        strokeWidth: 1.5 / canvas.getZoom(), 
        selectable: false, 
        evented: false, 
        excludeFromExport: true, 
        opacity: 0.8,
        isGuideLine: true
      });
    };

    const resetHistory = () => {
      if (!canvas) return;
      isHandlingHistory.current = true;
      const json = canvasToHistoryJSON(canvas);
      historyStack.current = json ? [json] : [];
      historyIndex.current = json ? 0 : -1;
      isHandlingHistory.current = false;
    };

    const handleObjectMoving = (e) => {
      const obj = e.target;
      if (!obj) return;

      // Очищаем старые розовые линии
      canvas.getObjects().filter(o => o.isGuideLine).forEach(o => canvas.remove(o));

      // Считываем живые, актуальные размеры из рефа!
      const currentWidth = dimensionsRef.current.width;
      const currentHeight = dimensionsRef.current.height;
      
      const objW = obj.getScaledWidth();
      const objH = obj.getScaledHeight();

      const isCenterX = obj.originX === 'center';
      const isCenterY = obj.originY === 'center';

      let snappedX = false;
      let snappedY = false;

      const currLeftEdge = isCenterX ? obj.left - objW / 2 : obj.left;
      const currRightEdge = isCenterX ? obj.left + objW / 2 : obj.left + objW;
      const currCenterX = isCenterX ? obj.left : obj.left + objW / 2;
      const currTopEdge = isCenterY ? obj.top - objH / 2 : obj.top;
      const currBottomEdge = isCenterY ? obj.top + objH / 2 : obj.top + objH;
      const currCenterY = isCenterY ? obj.top : obj.top + objH / 2;

      // 1. Рассчитываем магнитное притяжение
      if (Math.abs(currCenterX - currentWidth / 2) < snapZone) {
        obj.left = isCenterX ? currentWidth / 2 : currentWidth / 2 - objW / 2;
        snappedX = currentWidth / 2;
      } else if (Math.abs(currLeftEdge - margin) < snapZone) {
        obj.left = isCenterX ? margin + objW / 2 : margin;
        snappedX = margin;
      } else if (Math.abs(currRightEdge - (currentWidth - margin)) < snapZone) {
        obj.left = isCenterX ? (currentWidth - margin) - objW / 2 : (currentWidth - margin) - objW;
        snappedX = currentWidth - margin;
      }

      if (Math.abs(currCenterY - currentHeight / 2) < snapZone) {
        obj.top = isCenterY ? currentHeight / 2 : currentHeight / 2 - objH / 2;
        snappedY = currentHeight / 2;
      } else if (Math.abs(currTopEdge - margin) < snapZone) {
        obj.top = isCenterY ? margin + objH / 2 : margin;
        snappedY = margin;
      } else if (Math.abs(currBottomEdge - (currentHeight - margin)) < snapZone) {
        obj.top = isCenterY ? (currentHeight - margin) - objH / 2 : (currentHeight - margin) - objH;
        snappedY = currentHeight - margin;
      }

      // 2. Рассчитываем жёсткие ограничения на основе динамических размеров
      const minLeft = isCenterX ? objW / 2 : 0;
      const maxLeft = isCenterX ? currentWidth - objW / 2 : currentWidth - objW;
      const minTop = isCenterY ? objH / 2 : 0;
      const maxTop = isCenterY ? currentHeight - objH / 2 : currentHeight - objH;

      if (obj.left < minLeft) obj.left = minLeft;
      if (obj.left > maxLeft) obj.left = maxLeft;
      if (obj.top < minTop) obj.top = minTop;
      if (obj.top > maxTop) obj.top = maxTop;

      // 3. Рисуем новые розовые линии выравнивания
      if (snappedX !== false) {
        canvas.add(drawGuide([snappedX, 0, snappedX, currentHeight]));
      }
      if (snappedY !== false) {
        canvas.add(drawGuide([0, snappedY, currentWidth, snappedY]));
      }

      obj.setCoords();
      canvas.renderAll();
    };

    const handleMouseUp = () => {
      canvas.getObjects().filter(o => o.isGuideLine).forEach(o => canvas.remove(o));
      canvas.renderAll();
    };

    canvas.on('object:moving', handleObjectMoving);
    canvas.on('mouse:up', handleMouseUp);
    canvas.on('project:loaded', resetHistory);
    canvas.on('canvas:content-replaced', resetHistory);

    setTimeout(() => resetHistory(), 150);

    return () => {
      canvas.off('selection:created', handleSelection);
      canvas.off('selection:updated', handleSelection);
      canvas.off('selection:cleared', handleCleared);
      canvas.off('object:modified', handleObjectModified);
      canvas.off('object:added', saveState);
      canvas.off('object:removed', saveState);
      canvas.off('object:moving', handleObjectMoving);
      canvas.off('mouse:up', handleMouseUp);
      canvas.off('project:loaded', resetHistory);
      canvas.off('canvas:content-replaced', resetHistory);
      window.removeEventListener('keydown', handleKeyDown, true);
      canvas.dispose();
      initRef.current = false;
      clearTimeout(saveTimeout.current);
    };
    
  }, []); 

  // ==========================================
  // 2. ИНТЕРАКТИВНАЯ НАВИГАЦИЯ (МАСШТАБ И ПАНОРАМА)
  // ==========================================
  useEffect(() => {
    const canvas = canvasInstance.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let currentScale = 1;

    const notifyZoom = () => {
      container.dispatchEvent(new CustomEvent('canvas-zoom'));
    };

    const applyZoomToCanvas = (zoom) => {
      const { width: pageW, height: pageH } = dimensionsRef.current;
      restoreCanvasViewport(canvas, pageW, pageH, zoom);
      canvas.renderAll();
    };

    const syncScrollArea = () => {
      const c = canvasInstance.current;
      const content = scrollContentRef?.current;
      if (!c || !container || !content) return;

      const { width: pageW, height: pageH } = dimensionsRef.current;
      const zoom = c.getZoom();
      const wrapper = c.wrapperEl;

      // Расчётный размер — источник истины; wrapper мог остаться со старым zoom
      const displayW = Math.ceil(pageW * zoom);
      const displayH = Math.ceil(pageH * zoom);
      if (wrapper) {
        wrapper.style.width = `${displayW}px`;
        wrapper.style.height = `${displayH}px`;
      }

      const paperEl = content.firstElementChild;
      if (paperEl) {
        paperEl.style.width = `${displayW}px`;
        paperEl.style.minHeight = `${displayH}px`;
      }

      const pad = SCROLL_PAD;
      const innerW = displayW + pad * 2;
      const innerH = displayH + pad * 2;

      const totalW = Math.max(container.clientWidth, innerW);
      const needsVerticalScroll = innerH > container.clientHeight + 1;

      content.style.width = `${totalW}px`;
      content.style.boxSizing = 'border-box';
      content.style.display = 'flex';
      content.style.justifyContent = 'center';
      content.style.alignItems = 'flex-start';

      if (needsVerticalScroll) {
        content.style.paddingTop = `${pad}px`;
        content.style.paddingBottom = `${pad}px`;
        content.style.paddingLeft = `${pad}px`;
        content.style.paddingRight = `${pad}px`;
        content.style.height = `${innerH}px`;
        content.style.minHeight = `${innerH}px`;
      } else {
        const spare = Math.max(0, container.clientHeight - innerH);
        const topPad = pad + spare / 2;
        content.style.paddingTop = `${topPad}px`;
        content.style.paddingBottom = `${topPad}px`;
        content.style.paddingLeft = `${pad}px`;
        content.style.paddingRight = `${pad}px`;
        content.style.height = `${container.clientHeight}px`;
        content.style.minHeight = `${container.clientHeight}px`;
      }
    };

    let layoutRaf = null;
    const scheduleScrollSync = () => {
      if (layoutRaf) cancelAnimationFrame(layoutRaf);
      layoutRaf = requestAnimationFrame(() => {
        syncScrollArea();
        requestAnimationFrame(syncScrollArea);
        layoutRaf = null;
      });
    };

    const fitToScreen = () => {
      const { width: pageW, height: pageH } = dimensionsRef.current;
      const availableWidth = container.clientWidth - 80;
      const availableHeight = container.clientHeight - 80;

      currentScale = Math.min(availableWidth / pageW, availableHeight / pageH);
      applyZoomToCanvas(currentScale);
      scheduleScrollSync();
      notifyZoom();
    };

    fitToScreen(); 
    window.addEventListener('resize', fitToScreen);

    const handleWheel = (e) => {
      const canScroll =
        container.scrollHeight > container.clientHeight + 1 ||
        container.scrollWidth > container.clientWidth + 1;

      if (!e.altKey) {
        if (canScroll) {
          container.scrollTop += e.deltaY;
          container.scrollLeft += e.deltaX;
          e.preventDefault();
        }
        return;
      }

      e.preventDefault();

      const zoomStep = 0.1;
      const direction = e.deltaY > 0 ? -1 : 1;
      const activeScale = canvas.getZoom();
      let newScale = activeScale * (1 + direction * zoomStep);

      if (newScale < 0.1) newScale = 0.1;
      if (newScale > 5) newScale = 5;

      const canvasRect = canvas.wrapperEl.getBoundingClientRect();
      const mouseXOnCanvas = e.clientX - canvasRect.left;
      const mouseYOnCanvas = e.clientY - canvasRect.top;
      const originalX = mouseXOnCanvas / activeScale;
      const originalY = mouseYOnCanvas / activeScale;

      applyZoomToCanvas(newScale);

      const newMouseXOnCanvas = originalX * newScale;
      const newMouseYOnCanvas = originalY * newScale;

      container.scrollLeft += newMouseXOnCanvas - mouseXOnCanvas;
      container.scrollTop += newMouseYOnCanvas - mouseYOnCanvas;
      syncScrollArea();
      notifyZoom();
    };

    let isPanning = false;
    let startX = 0;
    let startY = 0;
    let scrollLeftStart = 0;
    let scrollTopStart = 0;

    const handleMouseDown = (e) => {
      if (e.shiftKey && e.button === 1) {
        e.preventDefault();
        isPanning = true;
        startX = e.clientX;
        startY = e.clientY;
        scrollLeftStart = container.scrollLeft;
        scrollTopStart = container.scrollTop;
        
        document.body.style.cursor = 'grabbing';
      }
    };

    const handleMouseMove = (e) => {
      if (!isPanning) return;
      e.preventDefault();
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      container.scrollLeft = scrollLeftStart - dx;
      container.scrollTop = scrollTopStart - dy;
    };

    const handleMouseUp = () => {
      if (isPanning) {
        isPanning = false;
        document.body.style.cursor = '';
      }
    };

    const disableAuxClick = (e) => {
      if (e.button === 1 && e.shiftKey) e.preventDefault();
    };

    container.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('auxclick', disableAuxClick);

    const resetCanvasToPage = () => {
      const c = canvasInstance.current;
      if (!c) return;
      const { width: pageW, height: pageH } = dimensionsRef.current;
      restoreCanvasViewport(c, pageW, pageH, c.getZoom());
      c.renderAll();
    };

    const onContentReplaced = () => {
      resetCanvasToPage();
      notifyZoom();
      const runSync = () => {
        syncScrollArea();
        canvas.calcOffset?.();
      };
      scheduleScrollSync();
      requestAnimationFrame(() => {
        runSync();
        requestAnimationFrame(runSync);
      });
    };

    const onLayout = () => {
      if (canvas._suppressLayout) return;
      scheduleScrollSync();
    };

    const onLayoutNow = () => syncScrollArea();

    const onProjectLoaded = () => {
      resetCanvasToPage();
      fitToScreen();
      syncScrollArea();
      requestAnimationFrame(syncScrollArea);
    };

    canvas.on('object:added', onLayout);
    canvas.on('object:removed', onLayout);
    canvas.on('object:modified', onLayout);
    canvas.on('project:loaded', onProjectLoaded);
    canvas.on('canvas:content-replaced', onContentReplaced);
    container.addEventListener('canvas-layout', onLayoutNow);
    
    return () => {
      if (layoutRaf) cancelAnimationFrame(layoutRaf);
      canvas.off('object:added', onLayout);
      canvas.off('object:removed', onLayout);
      canvas.off('object:modified', onLayout);
      canvas.off('project:loaded', onProjectLoaded);
      canvas.off('canvas:content-replaced', onContentReplaced);
      container.removeEventListener('canvas-layout', onLayoutNow);
      window.removeEventListener('resize', fitToScreen);
      container.removeEventListener('wheel', handleWheel, { capture: true });
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('auxclick', disableAuxClick);
    };
  }, [width, height, containerRef, scrollContentRef]);
};
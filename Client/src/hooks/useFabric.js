import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { useWorkspace } from '../context/WorkspaceContext';

export const useFabric = (canvasRef, containerRef, width = 1200, height = 1700) => {
  const { setCanvas, updateSelectedObject } = useWorkspace();
  const initRef = useRef(false);
  const canvasInstance = useRef(null);

  const historyStack = useRef([]);
  const historyIndex = useRef(-1);
  const isHandlingHistory = useRef(false);
  const saveTimeout = useRef(null);

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
    });

    canvasInstance.current = canvas;
    setCanvas(canvas);

    const handleSelection = (e) => updateSelectedObject(e.selected?.[0] || null);
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
        const json = JSON.stringify(canvas.toJSON(['isGridLine', 'excludeFromExport']));
        if (historyIndex.current >= 0 && historyStack.current[historyIndex.current] === json) return;
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

    canvas.on('object:added', saveState);
    canvas.on('object:removed', saveState);

    const undo = () => {
      if (historyIndex.current > 0) {
        isHandlingHistory.current = true;
        historyIndex.current--;
        canvas.loadFromJSON(historyStack.current[historyIndex.current], () => {
          canvas.renderAll();
          isHandlingHistory.current = false;
        });
      }
    };

    const redo = () => {
      if (historyIndex.current < historyStack.current.length - 1) {
        isHandlingHistory.current = true;
        historyIndex.current++;
        canvas.loadFromJSON(historyStack.current[historyIndex.current], () => {
          canvas.renderAll();
          isHandlingHistory.current = false;
        });
      }
    };

    // --- ГОРЯЧИЕ КЛАВИШИ ---
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;
      
      if (e.ctrlKey || e.metaKey) {
        if (e.code === 'KeyZ') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
        if (e.code === 'KeyY') { e.preventDefault(); redo(); return; }
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObj = canvas.getActiveObject();
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
    window.addEventListener('keydown', handleKeyDown);

    // --- МОДИФИКАЦИЯ РАЗМЕРОВ И БАРЬЕРЫ ---
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
          obj.set({ width: Math.max(1, obj.width * obj.scaleX), height: Math.max(1, obj.height * obj.scaleY), scaleX: 1, scaleY: 1 });
        }
      }

      // Барьеры выхода за края
      const currentWidth = width;
      const currentHeight = height;
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

    // --- НАПРАВЛЯЮЩИЕ И МАГНИТЫ ---
    const snapZone = 15; 
    const margin = 60; 
    let vGuide = null;
    let hGuide = null;

    const drawGuide = (coords) => {
      return new fabric.Line(coords, {
        stroke: '#ec4899', 
        strokeWidth: 1.5 / canvas.getZoom(), 
        selectable: false, evented: false, excludeFromExport: true, opacity: 0.8
      });
    };

    canvas.on('object:moving', (e) => {
      const obj = e.target;
      const currentWidth = width;
      const currentHeight = height;
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

      if (vGuide) { canvas.remove(vGuide); vGuide = null; }
      if (hGuide) { canvas.remove(hGuide); hGuide = null; }

      let snappedX = false;
      let snappedY = false;

      const currLeftEdge = isCenterX ? obj.left - objW / 2 : obj.left;
      const currRightEdge = isCenterX ? obj.left + objW / 2 : obj.left + objW;
      const currCenterX = isCenterX ? obj.left : obj.left + objW / 2;
      const currTopEdge = isCenterY ? obj.top - objH / 2 : obj.top;
      const currBottomEdge = isCenterY ? obj.top + objH / 2 : obj.top + objH;
      const currCenterY = isCenterY ? obj.top : obj.top + objH / 2;

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

      if (snappedX !== false) {
        vGuide = drawGuide([snappedX, 0, snappedX, currentHeight]);
        canvas.add(vGuide);
      }
      if (snappedY !== false) {
        hGuide = drawGuide([0, snappedY, currentWidth, snappedY]);
        canvas.add(hGuide);
      }

      obj.setCoords();
    });

    canvas.on('mouse:up', () => {
      if (vGuide) { canvas.remove(vGuide); vGuide = null; }
      if (hGuide) { canvas.remove(hGuide); hGuide = null; }
      canvas.renderAll();
    });

    return () => {
      canvas.off('selection:created', handleSelection);
      canvas.off('selection:updated', handleSelection);
      canvas.off('selection:cleared', handleCleared);
      canvas.off('object:modified', handleObjectModified);
      canvas.off('object:added', saveState);
      canvas.off('object:removed', saveState);
      window.removeEventListener('keydown', handleKeyDown); 
      canvas.dispose();
      initRef.current = false;
      clearTimeout(saveTimeout.current);
    };
    
  }, []); 

  // ==========================================
  // 2. ИНТЕРАКТИВНАЯ НАВИГАЦИЯ (НАДЕЖНАЯ НА ОСНОВЕ НАТИВНОГО СТАРУШКИ-КОДА)
  // ==========================================
  useEffect(() => {
    const canvas = canvasInstance.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let currentScale = 1;

    // Авто-подгонка по экрану при первой загрузке или ресайзе
    const fitToScreen = () => {
      const availableWidth = container.clientWidth - 80;
      const availableHeight = container.clientHeight - 80;
      
      currentScale = Math.min(availableWidth / width, availableHeight / height);

      canvas.setZoom(currentScale);
      canvas.setWidth(width * currentScale);
      canvas.setHeight(height * currentScale);
      canvas.renderAll();
    };

    fitToScreen(); 
    window.addEventListener('resize', fitToScreen);

    // --- ЗУМ (ALT + КОЛЕСИКО МЫШИ) ---
    const handleWheel = (e) => {
      if (e.altKey) {
        e.preventDefault(); 
        
        const zoomStep = 0.1; 
        const direction = e.deltaY > 0 ? -1 : 1;
        let newScale = currentScale * (1 + direction * zoomStep);

        // Ограничиваем зум от 10% до 500%
        if (newScale < 0.1) newScale = 0.1;
        if (newScale > 5) newScale = 5;

        // Чтобы зумить ровно в ту точку, где находится курсор:
        const canvasRect = canvas.wrapperEl.getBoundingClientRect();
        
        const mouseXOnCanvas = e.clientX - canvasRect.left;
        const mouseYOnCanvas = e.clientY - canvasRect.top;

        const originalX = mouseXOnCanvas / currentScale;
        const originalY = mouseYOnCanvas / currentScale;

        currentScale = newScale;

        canvas.setZoom(currentScale);
        canvas.setWidth(width * currentScale);
        canvas.setHeight(height * currentScale);
        canvas.renderAll();

        const newMouseXOnCanvas = originalX * currentScale;
        const newMouseYOnCanvas = originalY * currentScale;

        container.scrollLeft += (newMouseXOnCanvas - mouseXOnCanvas);
        container.scrollTop += (newMouseYOnCanvas - mouseYOnCanvas);
      }
    };

    // --- ПАНОРАМИРОВАНИЕ (SHIFT + НАЖАТИЕ КОЛЕСИКА) ---
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

    // Блокируем надоедливую иконку авто-скролла в браузере
    const disableAuxClick = (e) => {
      if (e.button === 1 && e.shiftKey) e.preventDefault();
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('auxclick', disableAuxClick);
    
    return () => {
      window.removeEventListener('resize', fitToScreen);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('auxclick', disableAuxClick);
    };
  }, [width, height, containerRef]);
};
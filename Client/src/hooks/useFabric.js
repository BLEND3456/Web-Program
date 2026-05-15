import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { useWorkspace } from '../context/WorkspaceContext';

export const useFabric = (canvasRef, width = 800, height = 1000) => {
  const { setCanvas, updateSelectedObject } = useWorkspace();
  const fabricRef = useRef(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (!canvasRef?.current || initRef.current) return;
    initRef.current = true;

    try {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width,
        height,
        backgroundColor: '#ffffff',
        preserveObjectStacking: true,
        renderOnAddRemove: true,
      });

      fabricRef.current = canvas;
      setCanvas(canvas);

      // Функция для ограничения объекта границами холста
      const constrainObjectToBounds = (obj) => {
        if (!obj) return;

        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        const objWidth = (obj.width || 0) * (obj.scaleX || 1);
        const objHeight = (obj.height || 0) * (obj.scaleY || 1);

        // Ограничиваем позицию X
        if ((obj.left || 0) < 0) {
          obj.left = 0;
        }
        if ((obj.left || 0) + objWidth > canvasWidth) {
          obj.left = canvasWidth - objWidth;
        }

        // Ограничиваем позицию Y
        if ((obj.top || 0) < 0) {
          obj.top = 0;
        }
        if ((obj.top || 0) + objHeight > canvasHeight) {
          obj.top = canvasHeight - objHeight;
        }
      };

      // Обработчик при перемещении объекта
      const handleObjectMoving = (e) => {
        if (e.target) {
          constrainObjectToBounds(e.target);
        }
      };

      // Обработчик при масштабировании объекта
      const handleObjectScaling = (e) => {
        const obj = e.target;
        if (!obj) return;

        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        const objWidth = (obj.width || 0) * (obj.scaleX || 1);
        const objHeight = (obj.height || 0) * (obj.scaleY || 1);

        // Если объект выходит за границы, уменьшаем масштаб
        if (objWidth > canvasWidth && obj.width) {
          obj.scaleX = canvasWidth / obj.width;
        }
        if (objHeight > canvasHeight && obj.height) {
          obj.scaleY = canvasHeight / obj.height;
        }

        constrainObjectToBounds(obj);
      };

      const handleSelectionCreated = (e) => {
        const selected = e.selected?.[0];
        updateSelectedObject(selected || null);
        if (selected) {
          selected.on('moving', handleObjectMoving);
          selected.on('scaling', handleObjectScaling);
        }
      };

      const handleSelectionUpdated = (e) => {
        const selected = e.selected?.[0];
        updateSelectedObject(selected || null);
        
        canvas.getObjects().forEach(obj => {
          obj.off('moving', handleObjectMoving);
          obj.off('scaling', handleObjectScaling);
        });
        
        if (selected) {
          selected.on('moving', handleObjectMoving);
          selected.on('scaling', handleObjectScaling);
        }
      };

      const handleSelectionCleared = () => {
        updateSelectedObject(null);
        canvas.getObjects().forEach(obj => {
          obj.off('moving', handleObjectMoving);
          obj.off('scaling', handleObjectScaling);
        });
      };

      // Ограничиваем при добавлении объекта
      const handleObjectAdded = (e) => {
        if (e.target) {
          constrainObjectToBounds(e.target);
          e.target.on('moving', handleObjectMoving);
          e.target.on('scaling', handleObjectScaling);
        }
      };

      canvas.on('selection:created', handleSelectionCreated);
      canvas.on('selection:updated', handleSelectionUpdated);
      canvas.on('selection:cleared', handleSelectionCleared);
      canvas.on('object:added', handleObjectAdded);

      console.log('Canvas инициализирован успешно');

      return () => {
        try {
          canvas.off('selection:created', handleSelectionCreated);
          canvas.off('selection:updated', handleSelectionUpdated);
          canvas.off('selection:cleared', handleSelectionCleared);
          canvas.off('object:added', handleObjectAdded);

          canvas.getObjects().forEach(obj => {
            if (obj) {
              obj.off('moving', handleObjectMoving);
              obj.off('scaling', handleObjectScaling);
            }
          });

          canvas.dispose();
          console.log('Canvas очищен');
          initRef.current = false;
        } catch (e) {
          console.error('Ошибка при очистке canvas:', e);
        }
      };
    } catch (err) {
      console.error('Ошибка инициализации canvas:', err);
      initRef.current = false;
    }
  }, []);

  return fabricRef;
};
import React, { useRef } from 'react';
import { useFabric } from '../../hooks/useFabric';

const CanvasView = React.memo(({ width = 1200, height = 1700 }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // Передаем containerRef в хук для расчета зума и скролла
  useFabric(canvasRef, containerRef, width, height);

  return (
    <div className="flex-1 h-full w-full bg-[#121214] z-10 relative">
      {/* Контейнер, который мы реально скроллим и зумим. 
        Мы вешаем ref сюда, чтобы JS управлял прокруткой.
      */}
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-auto flex custom-scrollbar"
      >
        {/* m-auto держит холст по центру, когда он маленький, и позволяет скроллить, когда большой */}
        <div className="m-auto p-12 shrink-0">
          <div className="relative shadow-[0_0_80px_rgba(0,0,0,0.6)] bg-white rounded-sm select-none">
            <canvas ref={canvasRef} id="fabric-canvas" />
          </div>
        </div>
      </div>
    </div>
  );
});

export default CanvasView;
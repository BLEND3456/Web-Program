import React, { useRef } from 'react';
import { useFabric } from '../../hooks/useFabric';

const CanvasView = React.memo(({ width = 1200, height = 1700, containerRef: externalContainerRef }) => {
  const internalContainerRef = useRef(null);
  const containerRef = externalContainerRef || internalContainerRef;
  const canvasRef = useRef(null);
  const scrollContentRef = useRef(null);

  useFabric(canvasRef, containerRef, width, height, scrollContentRef);

  return (
    <div className="absolute inset-0 bg-app-canvas z-0 pointer-events-none">
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-auto custom-scrollbar pointer-events-auto"
      >
        <div ref={scrollContentRef}>
          <div className="relative bg-white rounded-sm select-none shrink-0 overflow-hidden border border-slate-200/80 dark:border-transparent shadow-[0_6px_22px_rgba(15,23,42,0.12)] dark:shadow-[0_0_36px_rgba(0,0,0,0.45)]">
            <canvas ref={canvasRef} id="fabric-canvas" className="block max-w-none" />
          </div>
        </div>
      </div>
    </div>
  );
});

export default CanvasView;

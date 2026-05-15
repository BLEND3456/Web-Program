import { useRef, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { projectsAPI } from '../../services/api';
import { useFabric } from '../../hooks/useFabric';

const CanvasView = () => {
  const { presetId } = useParams();
  const [preset, setPreset] = useState(null);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const loadPreset = async () => {
      try {
        const data = await projectsAPI.getById(presetId);
        setPreset(data);
      } catch (err) {
        console.error('Ошибка загрузки проекта:', err);
      }
    };
    if (presetId) loadPreset();
  }, [presetId]);

  useFabric(canvasRef, preset?.width, preset?.height);

  return (
    <div
      ref={containerRef}
      className="flex-1 h-full w-full overflow-auto p-12 flex justify-center items-center"
    >
      <div className="bg-white rounded-sm shadow-[0_8px_30px_rgb(0,0,0,0.08)] ring-1 ring-slate-900/5 transition-transform duration-300">
        <canvas 
          ref={canvasRef} 
          id="fabric-canvas"
          style={{ display: 'block' }}
        />
      </div>
    </div>
  );
};

export default CanvasView;
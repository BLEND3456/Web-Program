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
      className="flex-1 overflow-auto bg-gray-100 p-8 flex justify-center items-start"
      style={{ minHeight: '100%' }}
    >
      <div className="bg-white rounded-lg shadow-lg">
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
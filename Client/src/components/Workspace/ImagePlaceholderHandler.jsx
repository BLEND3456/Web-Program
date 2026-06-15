import { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { isImagePlaceholder } from '../../utils/imagePlaceholder';
import ImagePlaceholderModal from './ImagePlaceholderModal';

const ImagePlaceholderHandler = () => {
  const { canvas } = useWorkspace();
  const [activePlaceholder, setActivePlaceholder] = useState(null);

  useEffect(() => {
    if (!canvas) return;

    const onClick = (opt) => {
      const target = opt.target;
      if (!isImagePlaceholder(target)) return;
      setActivePlaceholder(target);
    };

    canvas.on('mouse:down', onClick);
    return () => canvas.off('mouse:down', onClick);
  }, [canvas]);

  return (
    <ImagePlaceholderModal
      open={Boolean(activePlaceholder)}
      placeholder={activePlaceholder}
      canvas={canvas}
      onClose={() => setActivePlaceholder(null)}
    />
  );
};

export default ImagePlaceholderHandler;

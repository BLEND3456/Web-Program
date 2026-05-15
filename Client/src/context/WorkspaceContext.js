import { createContext, useContext, useState } from 'react';

const WorkspaceContext = createContext();

export const useWorkspace = () => useContext(WorkspaceContext);

export const WorkspaceProvider = ({ children }) => {
  const [canvas, setCanvas] = useState(null);
  const [selectedObject, setSelectedObject] = useState(null);

  const updateSelectedObject = (obj) => setSelectedObject(obj);

  return (
    <WorkspaceContext.Provider
      value={{ canvas, setCanvas, selectedObject, updateSelectedObject }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};
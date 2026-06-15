import { createContext, useContext, useState } from 'react';

const WorkspaceContext = createContext();

export const useWorkspace = () => useContext(WorkspaceContext);

const DEFAULT_PAGE_SIZE = { width: 1200, height: 1700 };

export const WorkspaceProvider = ({ children }) => {
  const [canvas, setCanvas] = useState(null);
  const [selectedObject, setSelectedObject] = useState(null);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const updateSelectedObject = (obj) => setSelectedObject(obj);

  return (
    <WorkspaceContext.Provider
      value={{
        canvas,
        setCanvas,
        selectedObject,
        updateSelectedObject,
        pageSize,
        setPageSize,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};
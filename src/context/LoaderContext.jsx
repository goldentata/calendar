import { createContext, useState } from 'react';

export const LoaderContext = createContext();

export function LoaderProvider({ children }) {
  const [isLoaderOn, setIsLoaderOn] = useState(false);

  return (
    <LoaderContext.Provider value={{ isLoaderOn, setIsLoaderOn }}>
      {children}
      
        <div className={`global-loader ${isLoaderOn ? 'active' : ''}`}>
          <div className="spinner"></div>
        </div>
      
    </LoaderContext.Provider>
  );
}
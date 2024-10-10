import React, { createContext, useState, useContext } from 'react';

const ConnectionContext = createContext();

export const ConnectionProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [needsReload, setNeedsReload] = useState(false);

  const triggerReload = () => {
    setIsConnected(false);
    setNeedsReload(true);
  };

  const confirmReload = () => {
    setIsConnected(true);
    setNeedsReload(false);
  };

  return (
    <ConnectionContext.Provider value={{ isConnected, needsReload, triggerReload, confirmReload, setIsConnected }}>
      {children}
    </ConnectionContext.Provider>
  );
};

export const useConnection = () => useContext(ConnectionContext);
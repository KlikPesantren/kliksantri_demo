import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from 'react';
import { storage } from '../utils/storage';

const ActiveChildContext = createContext(null);

export function ActiveChildProvider({ children }) {
  const [activeSantriId, setActiveSantriIdState] = useState(null);
  const [activeChild, setActiveChildState] = useState(null);

  const setActiveSantri = useCallback(async (child) => {
    // Backend returns santri_id (not id) — use santri_id as the canonical identifier
    const id = child.santri_id ?? child.id;
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      throw new Error('Data santri tidak valid.');
    }
    await storage.setActiveSantriId(id);
    setActiveSantriIdState(id);
    setActiveChildState(child);
  }, []);

  const restoreActiveChild = useCallback(async (anakList) => {
    if (!anakList || anakList.length === 0) return;

    const savedId = await storage.getActiveSantriId();
    const found = anakList.find(
      (a) => Number(a.santri_id ?? a.id) === Number(savedId)
    );
    const child = found ?? anakList[0];

    const id = child.santri_id ?? child.id;
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) return;
    if (!found) {
      await storage.setActiveSantriId(id);
    }
    setActiveSantriIdState(id);
    setActiveChildState(child);
  }, []);

  const clearActiveSantri = useCallback(() => {
    setActiveSantriIdState(null);
    setActiveChildState(null);
  }, []);

  return (
    <ActiveChildContext.Provider
      value={{
        activeSantriId,
        activeChild,
        setActiveSantri,
        restoreActiveChild,
        clearActiveSantri,
      }}
    >
      {children}
    </ActiveChildContext.Provider>
  );
}

export function useActiveChild() {
  const ctx = useContext(ActiveChildContext);
  if (!ctx) throw new Error('useActiveChild must be used inside ActiveChildProvider');
  return ctx;
}

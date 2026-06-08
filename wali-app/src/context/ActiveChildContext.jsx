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
    setActiveSantriIdState(id);
    setActiveChildState(child);
    await storage.setActiveSantriId(id);
  }, []);

  const restoreActiveChild = useCallback(async (anakList) => {
    if (!anakList || anakList.length === 0) return;

    const savedId = await storage.getActiveSantriId();
    const found = anakList.find(
      (a) => (a.santri_id ?? a.id) === savedId
    );
    const child = found ?? anakList[0];

    const id = child.santri_id ?? child.id;
    setActiveSantriIdState(id);
    setActiveChildState(child);

    if (!found) {
      await storage.setActiveSantriId(id);
    }
  }, []);

  return (
    <ActiveChildContext.Provider
      value={{
        activeSantriId,
        activeChild,
        setActiveSantri,
        restoreActiveChild,
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

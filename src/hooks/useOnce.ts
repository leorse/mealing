import { useRef, useState } from 'react';

/**
 * Verrou d'une action principale : `once` ne la lance que si aucune autre n'est en cours,
 * et `isBusy` grise le bouton aussitôt. Le `ref` est lu sans attendre le rendu : deux clics
 * dans la même image ne passent pas.
 */
export function useOnce(): { isBusy: boolean; once: (action: () => Promise<void>) => Promise<void> } {
  const [isBusy, setIsBusy] = useState(false);
  const busyRef = useRef(false);

  async function once(action: () => Promise<void>) {
    if (busyRef.current) return;
    busyRef.current = true;
    setIsBusy(true);
    try {
      await action();
    } finally {
      busyRef.current = false;
      setIsBusy(false);
    }
  }

  return { isBusy, once };
}

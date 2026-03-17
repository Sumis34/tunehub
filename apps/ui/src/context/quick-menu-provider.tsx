import { useCallback, useRef, useState } from "react";
import { QuickMenuContext } from "./quick-menu-context";

export function QuickMenuProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interactionRef = useRef(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const closeAfter = useCallback(
    (delay: number) => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }

      closeTimeoutRef.current = setTimeout(() => {
        
        if (!interactionRef.current) {
          close();
        }
      }, delay);
    },
    [close]
  );

  /**
   * Mark a user interaction has happened. This stops auto-closing until cleared.
   */
  const markInteraction = useCallback(() => {
    interactionRef.current = true;
  }, []);

  /**
   * Clear the interaction mark, allowing auto-closing to work again.
   */
  const clearInteraction = useCallback(() => {
    interactionRef.current = false;
  }, []);

  const value = {
    isOpen,
    open,
    close,
    toggle,
    closeAfter,
    markInteraction,
    clearInteraction,
  };

  return (
    <QuickMenuContext.Provider value={value}>
      {children}
    </QuickMenuContext.Provider>
  );
}

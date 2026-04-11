import { createContext } from "react";

interface QuickMenuContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  closeAfter: (delay: number) => void;
  markInteraction: () => void;
  clearInteraction: () => void;
}

export const QuickMenuContext = createContext<QuickMenuContextValue | null>(
  null
);

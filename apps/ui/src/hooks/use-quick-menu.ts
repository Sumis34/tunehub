import { useContext } from "react";
import { QuickMenuContext } from "../context/quick-menu-context";

export const useQuickMenu = () => {
  const ctx = useContext(QuickMenuContext);
  if (!ctx) {
    throw new Error("useQuickMenu must be used within a QuickMenuProvider");
  }
  return ctx;
};

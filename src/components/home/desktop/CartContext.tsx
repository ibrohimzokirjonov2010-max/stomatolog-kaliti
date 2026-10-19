"use client";
import { createContext, useContext, useState } from "react";
const Ctx = createContext<{ count: number; add: () => void }>({ count: 0, add: () => {} });
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(3);
  return <Ctx.Provider value={{ count, add: () => setCount((c) => c + 1) }}>{children}</Ctx.Provider>;
}
export const useCart = () => useContext(Ctx);

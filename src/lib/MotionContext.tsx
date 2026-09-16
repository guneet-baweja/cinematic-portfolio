import { createContext, useContext, type ReactNode } from "react";
import { useIsMobile, useReducedMotion } from "./hooks";

interface MotionContextValue {
  reducedMotion: boolean;
  isMobile: boolean;
  /** convenience: true when heavy 3D / pin / shader work should be skipped */
  lite: boolean;
}

const MotionContext = createContext<MotionContextValue>({
  reducedMotion: false,
  isMobile: false,
  lite: false,
});

export function MotionProvider({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const isMobile = useIsMobile();
  return (
    <MotionContext.Provider value={{ reducedMotion, isMobile, lite: reducedMotion || isMobile }}>
      {children}
    </MotionContext.Provider>
  );
}

export function useMotionContext() {
  return useContext(MotionContext);
}

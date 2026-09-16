---
name: motion
description: Declarative React UI animations with Motion (formerly Framer Motion). Use when implementing gesture-driven UI components, hover/tap springs, layout morphing, modal entrance/exit transitions, and interactive HUD overlays.
---

# Motion (Framer Motion) for React UI

Motion provides intuitive, spring-physics-based animations and layout transitions for React interfaces.

## UI Overlays & HUD Elements

```tsx
import { motion, AnimatePresence } from 'framer-motion';

export function ProjectModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-backdrop"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Project Overview</h2>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

## Interactive Magnetic Button
```tsx
import { motion } from 'framer-motion';

export function InteractiveButton({ label }: { label: string }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className="cinematic-btn"
    >
      {label}
    </motion.button>
  );
}
```

## Ownership Guideline
- Use Motion exclusively for HTML UI overlays, dialogs, buttons, and HUD elements.
- Let GSAP own canvas/scroll choreography to prevent layout conflicts.

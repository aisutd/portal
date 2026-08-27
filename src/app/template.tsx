"use client";

import { motion } from "framer-motion";

// Re-mounts on every navigation (unlike layout.tsx), so this is what gives
// every route a real transition-in instead of an instant hard cut.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

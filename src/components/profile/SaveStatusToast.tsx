"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

// Must render inside the <form> it's confirming — useFormStatus reads the
// nearest ancestor form's pending state, there's no other way to get it.
export function SaveStatusToast() {
  const { pending } = useFormStatus();
  const wasPending = useRef(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (wasPending.current && !pending) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 2500);
      return () => clearTimeout(timer);
    }
    wasPending.current = pending;
  }, [pending]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-[10px] rounded-full bg-ink px-[20px] py-[13px] shadow-lg"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="shrink-0">
            <circle cx="10" cy="10" r="10" fill="#356b2e" />
            <path d="M6 10.5l2.5 2.5 5.5-6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="style-body-text font-bold text-white">Changes saved</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

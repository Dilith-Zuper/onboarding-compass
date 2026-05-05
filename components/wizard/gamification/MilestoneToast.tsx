'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface Toast {
  id: number;
  message: string;
}

let toastQueue: ((msg: string) => void)[] = [];

export function showToast(message: string) {
  toastQueue.forEach((fn) => fn(message));
}

export function MilestoneToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  useEffect(() => {
    const fn = (message: string) => {
      const id = ++counter.current;
      setToasts((prev) => [...prev, { id, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    };
    toastQueue.push(fn);
    return () => {
      toastQueue = toastQueue.filter((f) => f !== fn);
    };
  }, []);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="bg-[#1A1A1A] text-white rounded-2xl px-5 py-4 max-w-sm w-[calc(100vw-3rem)] shadow-xl text-sm font-medium"
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

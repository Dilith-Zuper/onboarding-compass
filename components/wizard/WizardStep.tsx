'use client';

import { motion } from 'framer-motion';

interface WizardStepProps {
  children: React.ReactNode;
  stepKey: string;
}

export function WizardStep({ children, stepKey }: WizardStepProps) {
  return (
    <motion.div
      key={stepKey}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

'use client';

import { motion } from 'framer-motion';

export function CompletionScore({ score }: { score: number }) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className="bg-orange-50 border border-orange-200 rounded-2xl px-5 py-4 text-center"
    >
      <p className="text-[40px] font-extrabold text-[#1A1A1A] leading-tight">{score}%</p>
      <p className="text-sm text-gray-500 mt-1">
        Your account is <span className="font-semibold text-orange-600">{score}% ready</span> to go live
      </p>
    </motion.div>
  );
}

export function computeScore(
  answers: Record<string, any>,
  changeRequests: Record<string, string>
): number {
  let score = 0;
  const flowKeys = ['has_lead_qualification', 'job_types', 'uses_zuper_connect', 'wants_booking_widget', 'qualification_platform'];
  for (const k of flowKeys) {
    const v = answers[k];
    if (Array.isArray(v) ? v.length > 0 : !!v) score += 15;
  }
  if (answers['brands']?.length > 0)    score += 10;
  if (answers['suppliers']?.length > 0) score += 5;
  const crCount = Object.values(changeRequests).filter((v) => v?.trim()).length;
  score += Math.min(crCount * 5, 25);
  return Math.min(score, 100);
}

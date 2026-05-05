'use client';

import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ProgressBar } from './gamification/ProgressBar';
import { MilestoneToast, showToast } from './gamification/MilestoneToast';
import { computeScore } from './gamification/CompletionScore';
import { WizardStep } from './WizardStep';
import { WelcomeStep } from './steps/WelcomeStep';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import dynamic from 'next/dynamic';

const stepLoader = (label: string) => (
  <div className="max-w-[760px] mx-auto px-6 py-12 flex items-center gap-3">
    <LoadingSpinner size="sm" />
    <span className="text-sm text-gray-400">Loading {label}…</span>
  </div>
);

const QuestionsStep = dynamic(
  () => import('./steps/QuestionsStep').then((m) => ({ default: m.QuestionsStep })),
  { ssr: false, loading: () => stepLoader('questions') }
);
const FlowStep = dynamic(
  () => import('./steps/FlowStep').then((m) => ({ default: m.FlowStep })),
  { ssr: false, loading: () => stepLoader('flow diagram') }
);
const SnapshotStep = dynamic(
  () => import('./steps/SnapshotStep').then((m) => ({ default: m.SnapshotStep })),
  { ssr: false, loading: () => stepLoader('account data') }
);
const ReviewStep = dynamic(
  () => import('./steps/ReviewStep').then((m) => ({ default: m.ReviewStep })),
  { ssr: false, loading: () => stepLoader('review') }
);

interface WizardShellProps {
  token: string;
  orgName: string;
  snapshot: any;
  initialAnswers: Record<string, any>;
  initialChangeRequests: Record<string, string>;
}

export default function WizardShell({
  token,
  orgName,
  snapshot,
  initialAnswers,
  initialChangeRequests,
}: WizardShellProps) {
  const [step, setStep] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [answers, setAnswers] = useState<Record<string, any>>(initialAnswers);
  const [changeRequests, setChangeRequests] = useState<Record<string, string>>(initialChangeRequests);

  const score = computeScore(answers, changeRequests);

  const goTo = useCallback((nextStep: number) => {
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  function handleWelcomeNext(name: string) {
    setCustomerName(name);
    showToast('Great start — your flow is taking shape.');
    goTo(1);
  }

  function handleQuestionsNext(newAnswers: Record<string, any>) {
    setAnswers(newAnswers);
    showToast("Discovery complete. Let's look at your flow.");
    goTo(2);
  }

  function handleFlowNext() {
    showToast("Your Zuper flow is mapped. Here's what your team will see.");
    goTo(3);
  }

  function handleSnapshotNext() {
    showToast('Almost there — review your requests and submit.');
    goTo(4);
  }

  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      <ProgressBar currentStep={step} totalSteps={5} />

      {/* Constrain content width; px handles mobile gutter */}
      <div className="w-full">
        <AnimatePresence mode="wait">
          <WizardStep stepKey={`step-${step}`}>
            {step === 0 && (
              <WelcomeStep orgName={orgName} onNext={handleWelcomeNext} />
            )}
            {step === 1 && (
              <QuestionsStep
                customerName={customerName}
                answers={answers}
                onAnswerChange={setAnswers}
                onNext={handleQuestionsNext}
              />
            )}
            {step === 2 && (
              <FlowStep
                answers={answers}
                customerName={customerName}
                onNext={handleFlowNext}
              />
            )}
            {step === 3 && (
              <SnapshotStep
                token={token}
                snapshot={snapshot}
                answers={answers}
                changeRequests={changeRequests}
                onChangeRequest={(module, text) =>
                  setChangeRequests((prev) => ({ ...prev, [module]: text }))
                }
                onNext={handleSnapshotNext}
              />
            )}
            {step === 4 && (
              <ReviewStep
                token={token}
                orgName={orgName}
                customerName={customerName}
                answers={answers}
                changeRequests={changeRequests}
                score={score}
              />
            )}
          </WizardStep>
        </AnimatePresence>
      </div>

      <MilestoneToast />
    </div>
  );
}

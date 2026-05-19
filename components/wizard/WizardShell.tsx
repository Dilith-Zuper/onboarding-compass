'use client';

import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ProgressBar } from './gamification/ProgressBar';
import { MilestoneToast, showToast } from './gamification/MilestoneToast';
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
  saEmail: string;
  snapshot: any;
  initialAnswers: Record<string, any>;
  initialChangeRequests: Record<string, string>;
  initialCustomerName: string;
  hasZuperConnect: boolean;
  isPreview: boolean;
}

export default function WizardShell({
  token,
  orgName,
  saEmail,
  snapshot: initialSnapshot,
  initialAnswers,
  initialChangeRequests,
  initialCustomerName,
  hasZuperConnect,
  isPreview,
}: WizardShellProps) {
  // If returning customer (name already saved), skip the Welcome step
  const [step, setStep] = useState(initialCustomerName ? 1 : 0);
  const [customerName, setCustomerName] = useState(initialCustomerName);
  const [answers, setAnswers] = useState<Record<string, any>>(initialAnswers);
  const [changeRequests, setChangeRequests] = useState<Record<string, string>>(initialChangeRequests);
  const [snapshot, setSnapshot] = useState<any>(initialSnapshot);

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
      {isPreview && (
        <div className="sticky top-0 z-[60] bg-amber-50 border-b border-amber-200">
          <div className="max-w-[760px] mx-auto px-6 py-2 flex items-center gap-3">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-amber-600">
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M7 5v3M7 10v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <p className="text-xs font-semibold text-amber-700 leading-tight">
              Preview mode — nothing is saved. Close the tab when done.
            </p>
          </div>
        </div>
      )}

      <ProgressBar currentStep={step} totalSteps={5} />

      <div className="w-full">
        <AnimatePresence mode="wait">
          <WizardStep stepKey={`step-${step}`}>
            {step === 0 && (
              <WelcomeStep
                token={token}
                orgName={orgName}
                onNext={handleWelcomeNext}
                isPreview={isPreview}
              />
            )}
            {step === 1 && (
              <QuestionsStep
                token={token}
                customerName={customerName}
                answers={answers}
                onAnswerChange={setAnswers}
                onNext={handleQuestionsNext}
                hasZuperConnect={hasZuperConnect}
                isPreview={isPreview}
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
                saEmail={saEmail}
                isPreview={isPreview}
                onChangeRequest={(module, text) =>
                  setChangeRequests((prev) => ({ ...prev, [module]: text }))
                }
                onSnapshotReady={setSnapshot}
                onNext={handleSnapshotNext}
              />
            )}
            {step === 4 && (
              <ReviewStep
                token={token}
                orgName={orgName}
                customerName={customerName}
                saEmail={saEmail}
                answers={answers}
                changeRequests={changeRequests}
                isPreview={isPreview}
              />
            )}
          </WizardStep>
        </AnimatePresence>
      </div>

      <MilestoneToast />
    </div>
  );
}

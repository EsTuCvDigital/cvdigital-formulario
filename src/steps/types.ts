import type { FieldPath, UseFormReturn } from 'react-hook-form';
import type { CvValues } from '@/lib/schema';
import type { StepId } from '@/lib/steps';

export type Notify = (message: string, tone?: 'success' | 'error' | 'info') => void;

export type StepProps = {
  form: UseFormReturn<CvValues>;
  notify: Notify;
  onOpenPrivacy: () => void;
  onGoToStep: (id: StepId) => void;
};

/** RHF no infiere rutas con índices dinámicos; este helper centraliza el cast. */
export const p = (path: string) => path as FieldPath<CvValues>;

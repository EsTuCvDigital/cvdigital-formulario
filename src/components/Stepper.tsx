import {
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  FolderKanban,
  GraduationCap,
  Sparkles,
  Target,
  UserRound,
  Users,
} from 'lucide-react';
import type { StepDef } from '@/lib/steps';
import { cn } from '@/lib/utils';
import { ProgressBar } from './ui';

const icons = {
  user: UserRound,
  target: Target,
  briefcase: BriefcaseBusiness,
  graduation: GraduationCap,
  sparkles: Sparkles,
  badge: BadgeCheck,
  folder: FolderKanban,
  users: Users,
  check: CheckCircle2,
} as const;

export function StepIcon({ icon, className }: { icon: StepDef['icon']; className?: string }) {
  const Icon = icons[icon];
  return <Icon aria-hidden className={className} />;
}

export function Stepper({
  steps,
  currentIndex,
  maxVisited,
  onSelect,
}: {
  steps: StepDef[];
  currentIndex: number;
  maxVisited: number;
  onSelect: (index: number) => void;
}) {
  return (
    <nav aria-label="Pasos del formulario" className="hidden lg:block">
      <ol className="relative space-y-0.5">
        <span
          aria-hidden
          className="absolute top-5 bottom-5 left-[19px] w-px bg-stone-200 dark:bg-white/10"
        />
        {steps.map((step, index) => {
          const done = index < currentIndex;
          const current = index === currentIndex;
          const reachable = index <= maxVisited;
          return (
            <li key={step.id} className="relative">
              <button
                type="button"
                onClick={() => reachable && onSelect(index)}
                disabled={!reachable}
                aria-current={current ? 'step' : undefined}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition',
                  reachable ? 'cursor-pointer hover:bg-white/70 dark:hover:bg-white/[0.05]' : 'cursor-default',
                  current && 'bg-white shadow-soft dark:bg-white/[0.06]',
                )}
              >
                <span
                  className={cn(
                    'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border transition',
                    current
                      ? 'border-brand-700 bg-brand-700 text-white'
                      : done
                        ? 'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/15 dark:text-brand-300'
                        : 'border-stone-200 bg-stone-50 text-stone-400 dark:border-white/10 dark:bg-white/[0.03] dark:text-stone-500',
                  )}
                >
                  {done ? <Check className="size-4" aria-hidden /> : <StepIcon icon={step.icon} className="size-4" />}
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      'block truncate text-[13px] font-semibold',
                      current
                        ? 'text-stone-900 dark:text-white'
                        : done
                          ? 'text-stone-600 dark:text-stone-300'
                          : 'text-stone-400 dark:text-stone-500',
                    )}
                  >
                    {step.short}
                  </span>
                  <span className="block text-[10.5px] text-stone-400 dark:text-stone-500">
                    {done ? 'Completado' : current ? 'En curso' : `Paso ${index + 1}`}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function MobileProgress({
  steps,
  currentIndex,
}: {
  steps: StepDef[];
  currentIndex: number;
}) {
  const percent = Math.round(((currentIndex + 1) / steps.length) * 100);
  return (
    <div className="lg:hidden">
      <div className="flex items-center justify-between gap-3 text-[11px] font-medium text-stone-500 dark:text-stone-400">
        <span>
          Paso {currentIndex + 1} de {steps.length}
        </span>
        <span className="tabular-nums">{percent}%</span>
      </div>
      <ProgressBar value={percent} className="mt-1.5" />
    </div>
  );
}

import { Check, FileText, ShieldCheck } from 'lucide-react';
import { SERVICE_NAME } from '@/lib/constants';
import { IconButton } from './ui';
import { ThemeSwitch } from './ThemeSwitch';

function formatTime(timestamp: number): string {
  try {
    return new Intl.DateTimeFormat('es-CO', { hour: '2-digit', minute: '2-digit' }).format(new Date(timestamp));
  } catch {
    return '';
  }
}

export function Header({
  phase,
  savedAt,
  onHome,
  onOpenPrivacy,
}: {
  phase: 'welcome' | 'form' | 'success';
  savedAt: number | null;
  onHome: () => void;
  onOpenPrivacy: () => void;
}) {
  return (
    <header className="glass sticky top-0 z-30 border-b border-stone-200/70 dark:border-white/[0.07]">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onHome}
          className="group flex min-w-0 items-center gap-2.5 rounded-lg text-left"
          aria-label={`${SERVICE_NAME} · ir al inicio`}
        >
          <span className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-white shadow-sm transition group-hover:bg-brand-800">
            <FileText className="size-4" aria-hidden />
            <span className="absolute -right-0.5 -bottom-0.5 flex size-3.5 items-center justify-center rounded-full border-2 border-white bg-accent-500 dark:border-[#0a0d0c]">
              <Check className="size-2 text-stone-950" aria-hidden />
            </span>
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[14px] leading-tight font-bold tracking-tight text-stone-900 dark:text-white">
              {SERVICE_NAME}
            </span>
            <span className="block truncate text-[10px] tracking-[0.12em] text-stone-400 uppercase dark:text-stone-500">
              Perfil profesional
            </span>
          </span>
        </button>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
          {phase === 'form' ? (
            <span className="mr-1 hidden items-center gap-1.5 text-[11px] font-medium text-stone-500 sm:inline-flex dark:text-stone-400">
              <span className="flex size-4 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                <Check className="size-2.5" aria-hidden />
              </span>
              {savedAt ? `Guardado ${formatTime(savedAt)}` : 'Guardado automático'}
            </span>
          ) : null}

          <ThemeSwitch />

          <IconButton onClick={onOpenPrivacy} aria-label="Privacidad y tratamiento de datos" title="Privacidad">
            <ShieldCheck className="size-4" aria-hidden />
          </IconButton>
        </div>
      </div>
    </header>
  );
}

export function Footer({ onOpenPrivacy }: { onOpenPrivacy: () => void }) {
  const year = new Date().getFullYear();
  return (
    <footer className="relative border-t border-stone-200/70 bg-white/40 dark:border-white/[0.06] dark:bg-transparent">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-[11px] text-stone-400 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          © {year} {SERVICE_NAME} · Formulario de perfil profesional
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <button type="button" onClick={onOpenPrivacy} className="font-medium transition hover:text-stone-700 dark:hover:text-stone-200">
            Privacidad y datos
          </button>
          <span>Alojado en Supabase · cifrado en tránsito</span>
        </div>
      </div>
    </footer>
  );
}

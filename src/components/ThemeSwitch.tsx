import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme, type ThemePreference } from '@/lib/theme';
import { cn } from '@/lib/utils';

const options: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: 'light', label: 'Tema claro', Icon: Sun },
  { value: 'dark', label: 'Tema oscuro', Icon: Moon },
  { value: 'system', label: 'Tema del sistema', Icon: Monitor },
];

export function ThemeSwitch({ className }: { className?: string }) {
  const { preference, setPreference } = useTheme();

  return (
    <div
      role="group"
      aria-label="Tema de la interfaz"
      className={cn(
        'inline-flex items-center gap-0.5 rounded-lg border border-stone-200 bg-white/80 p-0.5 dark:border-white/10 dark:bg-white/[0.04]',
        className,
      )}
    >
      {options.map(({ value, label, Icon }) => {
        const active = preference === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setPreference(value)}
            aria-pressed={active}
            aria-label={label}
            title={label}
            className={cn(
              'inline-flex size-7 items-center justify-center rounded-md transition',
              active
                ? 'bg-stone-900 text-white shadow-sm dark:bg-white dark:text-stone-900'
                : 'text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-white/10 dark:hover:text-stone-200',
            )}
          >
            <Icon className="size-3.5" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}

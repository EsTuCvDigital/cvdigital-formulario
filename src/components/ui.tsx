import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { useController, type Control, type FieldPath } from 'react-hook-form';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  Info,
  Loader2,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CvValues } from '@/lib/schema';
import type { Option } from '@/lib/options';

/* -------------------------------------------------------------------------- */
/*  Botones                                                                   */
/* -------------------------------------------------------------------------- */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
};

const buttonVariants = {
  primary:
    'bg-brand-700 text-white shadow-[0_10px_28px_-14px_rgba(4,120,87,0.9)] hover:bg-brand-800 active:translate-y-px',
  accent:
    'bg-accent-500 text-stone-950 shadow-[0_10px_28px_-14px_rgba(217,119,6,0.8)] hover:bg-accent-400 active:translate-y-px',
  secondary:
    'border border-stone-200 bg-white text-stone-800 shadow-sm hover:border-stone-300 hover:bg-stone-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-stone-100 dark:hover:bg-white/[0.08]',
  ghost:
    'text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-white/[0.06] dark:hover:text-white',
  danger:
    'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20',
};

const buttonSizes = {
  sm: 'h-9 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-11 px-5 text-[15px] gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading, icon, children, type = 'button', disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex select-none items-center justify-center font-semibold transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0a0d0c]',
        'disabled:cursor-not-allowed disabled:opacity-55',
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 aria-hidden className="size-4 animate-spin" /> : icon}
      {children}
    </button>
  );
});

export const IconButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  function IconButton({ className, ...props }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'inline-flex size-9 items-center justify-center rounded-lg text-stone-500 transition',
          'hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-white/[0.08] dark:hover:text-white',
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/25',
          className,
        )}
        {...props}
      />
    );
  },
);

/* -------------------------------------------------------------------------- */
/*  Superficies                                                               */
/* -------------------------------------------------------------------------- */

export function Card({
  className,
  children,
  as: Tag = 'div',
}: {
  className?: string;
  children: ReactNode;
  as?: 'div' | 'section' | 'article' | 'aside';
}) {
  return (
    <Tag
      className={cn(
        'rounded-2xl border border-stone-200/80 bg-white shadow-soft dark:border-white/10 dark:bg-white/[0.03]',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'brand' | 'accent' | 'success' | 'danger';
  className?: string;
}) {
  const tones = {
    neutral: 'bg-stone-100 text-stone-600 dark:bg-white/[0.06] dark:text-stone-300',
    brand: 'bg-brand-50 text-brand-800 dark:bg-brand-500/10 dark:text-brand-300',
    accent: 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    danger: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Alert({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const config = {
    info: {
      wrap: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-100',
      icon: <Info className="size-[18px] shrink-0" aria-hidden />,
    },
    warning: {
      wrap: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100',
      icon: <AlertTriangle className="size-[18px] shrink-0" aria-hidden />,
    },
    error: {
      wrap: 'border-red-200 bg-red-50 text-red-900 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-100',
      icon: <AlertTriangle className="size-[18px] shrink-0" aria-hidden />,
    },
    success: {
      wrap: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100',
      icon: <CheckCircle2 className="size-[18px] shrink-0" aria-hidden />,
    },
  }[tone];

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex items-start gap-3 rounded-xl border p-3.5 text-sm', config.wrap, className)}
    >
      <span className="mt-0.5">{config.icon}</span>
      <div className="min-w-0 space-y-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className="leading-relaxed opacity-90">{children}</div> : null}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Campos                                                                    */
/* -------------------------------------------------------------------------- */

type FieldShellProps = {
  id: string;
  label?: string;
  required?: boolean;
  help?: string;
  error?: string;
  counter?: string;
  className?: string;
  children: ReactNode;
};

function FieldShell({ id, label, required, help, error, counter, className, children }: FieldShellProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label ? (
        <div className="flex items-end justify-between gap-3">
          <label htmlFor={id} className="text-[13.5px] leading-snug font-semibold text-stone-800 dark:text-stone-200">
            {label}
            {required ? (
              <span className="ml-1 text-brand-600 dark:text-brand-400" aria-hidden>
                *
              </span>
            ) : (
              <span className="ml-2 text-[11px] font-medium text-stone-400 dark:text-stone-500">Opcional</span>
            )}
          </label>
          {counter ? (
            <span className="shrink-0 text-[11px] tabular-nums text-stone-400 dark:text-stone-500">{counter}</span>
          ) : null}
        </div>
      ) : null}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="flex items-start gap-1 text-xs font-medium text-red-600 dark:text-red-400">
          <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden />
          <span>{error}</span>
        </p>
      ) : help ? (
        <p id={`${id}-help`} className="text-xs leading-relaxed text-stone-500 dark:text-stone-400">
          {help}
        </p>
      ) : null}
    </div>
  );
}

const controlBase =
  'w-full rounded-xl border bg-white px-3.5 text-[15px] text-stone-900 shadow-sm transition placeholder:text-stone-400 ' +
  'focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none ' +
  'disabled:cursor-not-allowed disabled:bg-stone-100 ' +
  'dark:bg-white/[0.03] dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-brand-400';

const borderOk = 'border-stone-200 hover:border-stone-300 dark:border-white/10 dark:hover:border-white/20';
const borderError = 'border-red-300 focus:border-red-500 focus:ring-red-500/10 dark:border-red-500/40';

function describedBy(id: string, error?: string, help?: string) {
  if (error) return `${id}-error`;
  if (help) return `${id}-help`;
  return undefined;
}

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  help?: string;
  error?: string;
  required?: boolean;
  wrapperClassName?: string;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, help, error, required, className, wrapperClassName, id, ...props },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? props.name ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} required={required} help={help} error={error} className={wrapperClassName}>
      <input
        ref={ref}
        id={fieldId}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy(fieldId, error, help)}
        className={cn(controlBase, 'h-11', error ? borderError : borderOk, className)}
        {...props}
      />
    </FieldShell>
  );
});

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  help?: string;
  error?: string;
  required?: boolean;
  wrapperClassName?: string;
  currentLength?: number;
  limit?: number;
};

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(function TextAreaField(
  { label, help, error, required, className, wrapperClassName, id, currentLength, limit, ...props },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? props.name ?? autoId;
  const counter = typeof currentLength === 'number' && limit ? `${currentLength}/${limit}` : undefined;
  return (
    <FieldShell
      id={fieldId}
      label={label}
      required={required}
      help={help}
      error={error}
      counter={counter}
      className={wrapperClassName}
    >
      <textarea
        ref={ref}
        id={fieldId}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy(fieldId, error, help)}
        className={cn(controlBase, 'min-h-28 py-2.5 leading-relaxed', error ? borderError : borderOk, className)}
        {...props}
      />
    </FieldShell>
  );
});

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  options: readonly Option[];
  placeholder?: string;
  wrapperClassName?: string;
};

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, hint, error, required, options, placeholder = 'Selecciona una opción', className, wrapperClassName, id, ...props },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? props.name ?? autoId;
  return (
    <FieldShell
      id={fieldId}
      label={label}
      required={required}
      help={hint}
      error={error}
      className={wrapperClassName}
    >
      <div className="relative">
        <select
          ref={ref}
          id={fieldId}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy(fieldId, error, hint)}
          className={cn(
            controlBase,
            'h-11 appearance-none pr-10',
            error ? borderError : borderOk,
            !props.value && 'text-stone-400 dark:text-stone-500',
            className,
          )}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-stone-400"
        />
      </div>
    </FieldShell>
  );
});

type MonthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  help?: string;
  error?: string;
  required?: boolean;
  wrapperClassName?: string;
};

export const MonthField = forwardRef<HTMLInputElement, MonthFieldProps>(function MonthField(
  { label, help, error, required, className, wrapperClassName, id, ...props },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? props.name ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} required={required} help={help} error={error} className={wrapperClassName}>
      <input
        ref={ref}
        id={fieldId}
        type="month"
        min="1950-01"
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy(fieldId, error, help)}
        className={cn(controlBase, 'h-11', error ? borderError : borderOk, className)}
        {...props}
      />
    </FieldShell>
  );
});

type NumberFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  help?: string;
  error?: string;
  required?: boolean;
  suffix?: string;
  wrapperClassName?: string;
};

export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(function NumberField(
  { label, help, error, required, suffix, className, wrapperClassName, id, ...props },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? props.name ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} required={required} help={help} error={error} className={wrapperClassName}>
      <div className="relative">
        <input
          ref={ref}
          id={fieldId}
          type="number"
          inputMode="numeric"
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy(fieldId, error, help)}
          className={cn(controlBase, 'h-11', suffix && 'pr-16', error ? borderError : borderOk, className)}
          {...props}
        />
        {suffix ? (
          <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-xs font-medium text-stone-400">
            {suffix}
          </span>
        ) : null}
      </div>
    </FieldShell>
  );
});

/* -------------------------------------------------------------------------- */
/*  Checkboxes y grupos                                                       */
/* -------------------------------------------------------------------------- */

type CheckboxFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  description?: string;
  error?: string;
};

export const CheckboxField = forwardRef<HTMLInputElement, CheckboxFieldProps>(function CheckboxField(
  { label, description, error, className, id, ...props },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? props.name ?? autoId;
  return (
    <div>
      <label
        htmlFor={fieldId}
        className={cn(
          'flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition',
          error
            ? 'border-red-300 bg-red-50/40 dark:border-red-500/40 dark:bg-red-500/[0.06]'
            : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/60 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.05]',
          'has-checked:border-brand-500 has-checked:bg-brand-50/50 has-checked:ring-2 has-checked:ring-brand-500/15 dark:has-checked:bg-brand-500/[0.08]',
          className,
        )}
      >
        <input
          ref={ref}
          id={fieldId}
          type="checkbox"
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          className="mt-0.5 size-[18px] shrink-0 cursor-pointer rounded border-stone-300 text-brand-700 accent-brand-700 focus:ring-brand-500"
          {...props}
        />
        <span className="min-w-0">
          <span className="block text-[13.5px] leading-snug font-semibold text-stone-800 dark:text-stone-100">
            {label}
          </span>
          {description ? (
            <span className="mt-0.5 block text-xs leading-relaxed text-stone-500 dark:text-stone-400">
              {description}
            </span>
          ) : null}
        </span>
      </label>
      {error ? (
        <p id={`${fieldId}-error`} role="alert" className="mt-1.5 flex items-start gap-1 text-xs font-medium text-red-600 dark:text-red-400">
          <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}
    </div>
  );
});

export function InlineCheckbox({
  label,
  className,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const autoId = useId();
  const fieldId = id ?? props.name ?? autoId;
  return (
    <label
      htmlFor={fieldId}
      className={cn('inline-flex cursor-pointer items-center gap-2 text-[13px] text-stone-600 dark:text-stone-300', className)}
    >
      <input
        id={fieldId}
        type="checkbox"
        className="size-4 rounded border-stone-300 accent-brand-700 focus:ring-brand-500"
        {...props}
      />
      {label}
    </label>
  );
}

type RadioCardGroupProps = {
  control: Control<CvValues>;
  name: FieldPath<CvValues>;
  label: string;
  help?: string;
  error?: string;
  options: readonly Option[];
  columns?: 1 | 2;
};

export function RadioCardGroup({ control, name, label, help, error, options, columns = 2 }: RadioCardGroupProps) {
  const { field } = useController({ control, name });
  const value = String(field.value ?? '');
  const groupId = useId();

  return (
    <fieldset>
      <legend className="mb-2 text-[13.5px] font-semibold text-stone-800 dark:text-stone-200">{label}</legend>
      {help ? <p className="mb-2.5 text-xs leading-relaxed text-stone-500 dark:text-stone-400">{help}</p> : null}
      <div role="radiogroup" aria-labelledby={groupId} className={cn('grid gap-2.5', columns === 2 ? 'sm:grid-cols-2' : 'grid-cols-1')}>
        {options.map((option) => {
          const checked = value === option.value;
          return (
            <label
              key={option.value}
              className={cn(
                'group relative flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all duration-200',
                checked
                  ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-500/15 dark:border-brand-400/60 dark:bg-brand-500/[0.08]'
                  : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/70 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.05]',
              )}
            >
              <input
                type="radio"
                name={field.name}
                value={option.value}
                checked={checked}
                onChange={() => {
                  field.onChange(option.value);
                  field.onBlur();
                }}
                className="sr-only"
              />
              <span
                aria-hidden
                className={cn(
                  'mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full border transition',
                  checked
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-stone-300 bg-white dark:border-white/25 dark:bg-transparent',
                )}
              >
                {checked ? <span className="size-1.5 rounded-full bg-white" /> : null}
              </span>
              <span className="min-w-0">
                <span className="block text-[13.5px] leading-snug font-semibold text-stone-800 dark:text-stone-100">
                  {option.label}
                </span>
                {option.description ? (
                  <span className="mt-0.5 block text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                    {option.description}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
      {error ? (
        <p role="alert" className="mt-1.5 flex items-start gap-1 text-xs font-medium text-red-600 dark:text-red-400">
          <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

type CheckGroupProps = {
  control: Control<CvValues>;
  name: FieldPath<CvValues>;
  label: string;
  help?: string;
  error?: string;
  options: readonly Option[];
  columns?: 2 | 3;
  max?: number;
};

export function CheckGroup({ control, name, label, help, error, options, columns = 3, max }: CheckGroupProps) {
  const { field } = useController({ control, name });
  const selected = Array.isArray(field.value) ? (field.value as string[]) : [];
  const limitReached = typeof max === 'number' && selected.length >= max;

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      field.onChange(selected.filter((item) => item !== value));
    } else if (!limitReached) {
      field.onChange([...selected, value]);
    }
    field.onBlur();
  };

  return (
    <fieldset>
      <div className="mb-2 flex items-end justify-between gap-3">
        <legend className="text-[13.5px] font-semibold text-stone-800 dark:text-stone-200">{label}</legend>
        {max ? (
          <span className="text-[11px] tabular-nums text-stone-400 dark:text-stone-500">
            {selected.length}/{max}
          </span>
        ) : null}
      </div>
      {help ? <p className="mb-2.5 text-xs leading-relaxed text-stone-500 dark:text-stone-400">{help}</p> : null}
      <div className={cn('grid gap-2', columns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3')}>
        {options.map((option) => {
          const checked = selected.includes(option.value);
          const disabled = !checked && limitReached;
          return (
            <label
              key={option.value}
              className={cn(
                'flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-[13px] font-medium transition',
                checked
                  ? 'border-brand-500 bg-brand-50/60 text-brand-900 dark:border-brand-400/60 dark:bg-brand-500/[0.1] dark:text-brand-100'
                  : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 dark:border-white/10 dark:bg-white/[0.03] dark:text-stone-300',
                disabled && 'cursor-not-allowed opacity-45',
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => toggle(option.value)}
                className="size-4 shrink-0 rounded border-stone-300 accent-brand-700 focus:ring-brand-500"
              />
              {option.label}
            </label>
          );
        })}
      </div>
      {error ? (
        <p role="alert" className="mt-1.5 flex items-start gap-1 text-xs font-medium text-red-600 dark:text-red-400">
          <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

type SegmentedLevelProps = {
  control: Control<CvValues>;
  name: FieldPath<CvValues>;
  label: string;
  error?: string;
};

const skillLevels = [
  { value: 1, label: 'Básico' },
  { value: 2, label: 'Elemental' },
  { value: 3, label: 'Intermedio' },
  { value: 4, label: 'Avanzado' },
  { value: 5, label: 'Experto' },
];

export function SegmentedLevel({ control, name, label, error }: SegmentedLevelProps) {
  const { field } = useController({ control, name });
  const current = Number(field.value ?? 3);

  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-semibold text-stone-800 dark:text-stone-200">{label}</span>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-5 gap-1 rounded-xl bg-stone-100 p-1 dark:bg-white/[0.06]">
        {skillLevels.map((level) => {
          const active = current === level.value;
          return (
            <button
              key={level.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => {
                field.onChange(level.value);
                field.onBlur();
              }}
              className={cn(
                'rounded-lg px-1 py-1.5 text-[11px] leading-tight font-semibold transition',
                active
                  ? 'bg-white text-brand-800 shadow-sm dark:bg-brand-500/25 dark:text-brand-100'
                  : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200',
              )}
            >
              {level.value}
              <span className="mt-0.5 block text-[9px] font-medium opacity-70">{level.label}</span>
            </button>
          );
        })}
      </div>
      {error ? <p className="mt-1 text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Estructura de pasos                                                       */
/* -------------------------------------------------------------------------- */

export function StepHeader({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro: string;
}) {
  return (
    <header className="max-w-2xl">
      <p className="hidden text-[11px] font-bold tracking-[0.16em] text-brand-700 uppercase lg:block dark:text-brand-400">
        {eyebrow}
      </p>
      <h2
        id="step-title"
        tabIndex={-1}
        className="mt-2 scroll-mt-24 font-display text-[clamp(1.6rem,3.4vw,2.3rem)] leading-[1.1] font-semibold tracking-tight text-stone-900 text-balance outline-none dark:text-white"
      >
        {title}
      </h2>
      <p className="mt-2.5 text-[14.5px] leading-relaxed text-stone-600 dark:text-stone-400">{intro}</p>
    </header>
  );
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cn('border-t border-stone-200 dark:border-white/10', className)} />;
}

export function Collapsible({
  title,
  children,
  defaultOpen = false,
  icon,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  icon?: ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-xl border border-stone-200 bg-white/70 dark:border-white/10 dark:bg-white/[0.03]"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[13px] font-semibold text-stone-700 dark:text-stone-200">
        <span className="flex items-center gap-2">
          {icon}
          {title}
        </span>
        <ChevronDown aria-hidden className="size-4 text-stone-400 transition group-open:rotate-180" />
      </summary>
      <div className="space-y-3 border-t border-stone-200 px-4 py-3.5 text-[13px] leading-relaxed text-stone-600 dark:border-white/10 dark:text-stone-400">
        {children}
      </div>
    </details>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/60 px-5 py-8 text-center dark:border-white/15 dark:bg-white/[0.02]">
      <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-stone-500 dark:text-stone-400">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function AddButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <Button variant="secondary" size="sm" onClick={onClick} disabled={disabled} icon={<Plus className="size-4" aria-hidden />}>
      {label}
    </Button>
  );
}

export function RepeatableCard({
  index,
  title,
  subtitle,
  onRemove,
  removeLabel,
  children,
}: {
  index: number;
  title: string;
  subtitle?: string;
  onRemove?: () => void;
  removeLabel?: string;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-stone-100 bg-stone-50/60 px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.02] sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-700 text-[11px] font-bold text-white">
            {index + 1}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13.5px] font-semibold text-stone-800 dark:text-stone-100">{title}</p>
            {subtitle ? <p className="truncate text-[11.5px] text-stone-500 dark:text-stone-400">{subtitle}</p> : null}
          </div>
        </div>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            aria-label={removeLabel ?? 'Eliminar este registro'}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-stone-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        ) : null}
      </div>
      <div className="space-y-4 p-4 sm:p-5">{children}</div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Progreso, toasts y modal                                                  */
/* -------------------------------------------------------------------------- */

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safe}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-white/10', className)}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700 transition-[width] duration-500 ease-out"
        style={{ width: `${safe}%` }}
      />
    </div>
  );
}

export function Toast({ message, tone = 'success', onClose }: { message: string; tone?: 'success' | 'error' | 'info'; onClose: () => void }) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const timer = window.setTimeout(() => onCloseRef.current(), 6000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-24 z-50 mx-auto flex max-w-md items-start gap-3 rounded-xl border border-stone-200 bg-white p-3.5 shadow-lift dark:border-white/10 dark:bg-[#121817] sm:inset-x-auto sm:top-20 sm:right-6 sm:bottom-auto sm:mx-0 sm:w-[22rem]"
    >
      <span
        className={cn(
          'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full',
          tone === 'success'
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
            : tone === 'error'
              ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300'
              : 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
        )}
      >
        {tone === 'success' ? <Check className="size-3.5" aria-hidden /> : <Info className="size-3.5" aria-hidden />}
      </span>
      <p className="flex-1 text-[13px] leading-snug text-stone-700 dark:text-stone-200">{message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar aviso"
        className="rounded p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-white/10"
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      aria-labelledby="modal-title"
      className="dialog-backdrop w-[min(92vw,42rem)] max-h-[85vh] overflow-y-auto rounded-2xl border border-stone-200 bg-white p-0 text-stone-900 shadow-lift backdrop:bg-black/50 dark:border-white/10 dark:bg-[#101514] dark:text-stone-100"
    >
      <div className="sticky top-0 flex items-center justify-between gap-4 border-b border-stone-200 bg-white/95 px-5 py-4 backdrop-blur dark:border-white/10 dark:bg-[#101514]/95">
        <h3 id="modal-title" className="font-display text-lg font-semibold">
          {title}
        </h3>
        <IconButton onClick={onClose} aria-label="Cerrar">
          <X className="size-4" aria-hidden />
        </IconButton>
      </div>
      <div className="space-y-4 px-5 py-5 text-[13.5px] leading-relaxed text-stone-600 dark:text-stone-300">
        {children}
      </div>
    </dialog>
  );
}

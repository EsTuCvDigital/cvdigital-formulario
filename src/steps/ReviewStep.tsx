import { useWatch } from 'react-hook-form';
import { ArrowRight, Check, Circle, FileText, Pencil, ShieldCheck, Sparkles } from 'lucide-react';
import { CONSENT_TEXT, PRIVACY_CONTACT } from '@/lib/constants';
import { computeProgress, progressPercent } from '@/lib/completeness';
import type { CvValues } from '@/lib/schema';
import type { SubmitFailure } from '@/lib/submit';
import { labelOf, LANGUAGE_LEVELS, LEVELS } from '@/lib/options';
import { formatBytes } from '@/lib/utils';
import {
  Alert,
  Badge,
  Card,
  CheckboxField,
  Divider,
  ProgressBar,
  TextAreaField,
} from '@/components/ui';
import type { StepProps } from './types';

export function ReviewStep({
  form,
  onOpenPrivacy,
  onGoToStep,
  submitError,
  configured,
}: StepProps & { submitError: SubmitFailure | null; configured: boolean }) {
  const {
    register,
    control,
    formState: { errors, isSubmitted, touchedFields },
  } = form;

  const consentError = isSubmitted || touchedFields.consent ? errors.consent?.message : undefined;
  const truthError = isSubmitted || touchedFields.truthConfirmed ? errors.truthConfirmed?.message : undefined;

  const raw = useWatch({ control });
  const values = raw as unknown as CvValues;
  const experiences = values.experiences ?? [];
  const education = values.education ?? [];
  const technical = values.technicalSkills ?? [];
  const soft = values.softSkills ?? [];
  const languages = values.languages ?? [];
  const projects = values.projects ?? [];
  const volunteering = values.volunteering ?? [];

  const sections = computeProgress(values);
  const percent = progressPercent(sections);
  const missing = sections.filter((item) => item.required && !item.done);
  const payloadSize = new Blob([JSON.stringify(values)]).size;

  return (
    <div className="space-y-7">
      {!configured ? (
        <Alert tone="warning" title="Falta conectar Supabase">
          El formulario está en modo local. Agrega <code className="rounded bg-black/5 px-1">VITE_SUPABASE_URL</code> y{' '}
          <code className="rounded bg-black/5 px-1">VITE_SUPABASE_ANON_KEY</code> en <code>.env.local</code> y reinicia
          el servidor. Sin eso, el botón de envío mostrará un error.
        </Alert>
      ) : null}

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-stone-100 bg-stone-50/60 p-5 dark:border-white/[0.06] dark:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-[0.14em] text-stone-400 uppercase dark:text-stone-500">
              Completitud del perfil
            </p>
            <p className="mt-1 font-display text-2xl font-semibold text-stone-900 dark:text-white">{percent}% listo</p>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              {missing.length === 0
                ? 'Todo lo obligatorio está completo. Revisa la vista previa y envía.'
                : `Faltan ${missing.length} sección(es) obligatoria(s).`}
            </p>
          </div>
          <div className="w-full sm:w-56">
            <ProgressBar value={percent} />
            <p className="mt-2 text-right text-[11px] tabular-nums text-stone-400">{formatBytes(payloadSize)} de información</p>
          </div>
        </div>

        <ul className="divide-y divide-stone-100 dark:divide-white/[0.06]">
          {sections.map((section) => (
            <li key={section.id} className="flex items-center gap-3 px-5 py-3">
              <span
                className={
                  section.done
                    ? 'flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white'
                    : 'flex size-6 shrink-0 items-center justify-center rounded-full border border-stone-300 text-stone-300 dark:border-white/15 dark:text-stone-600'
                }
              >
                {section.done ? <Check className="size-3.5" aria-hidden /> : <Circle className="size-3" aria-hidden />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-stone-800 dark:text-stone-100">{section.label}</p>
                <p className="truncate text-[11.5px] text-stone-500 dark:text-stone-400">{section.hint}</p>
              </div>
              {section.id !== 'review' ? (
                <button
                  type="button"
                  onClick={() => onGoToStep(section.id)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11.5px] font-semibold text-brand-700 transition hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
                >
                  <Pencil className="size-3" aria-hidden />
                  Editar
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </Card>

      {/* Vista previa */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-3.5 dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-brand-700 dark:text-brand-400" aria-hidden />
            <p className="text-[13px] font-semibold text-stone-800 dark:text-stone-200">Vista previa de tu perfil</p>
          </div>
          <Badge tone="brand">Borrador</Badge>
        </div>

        <div className="space-y-5 p-5">
          <div>
            <p className="font-display text-2xl leading-tight font-semibold text-stone-900 dark:text-white">
              {values.fullName?.trim() || 'Tu nombre'}
            </p>
            <p className="mt-0.5 text-sm font-medium text-brand-700 dark:text-brand-400">
              {values.headline?.trim() || 'Tu titular profesional'}
            </p>
            <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400">
              {[values.city, values.country, values.email, values.phone].filter(Boolean).join(' · ') || 'Datos de contacto'}
              {values.level ? ` · ${labelOf(LEVELS, values.level)}` : ''}
            </p>
            {values.linkedin || values.portfolio ? (
              <p className="mt-1 truncate text-[11.5px] text-stone-400">
                {[values.linkedin, values.portfolio].filter(Boolean).join(' · ')}
              </p>
            ) : null}
          </div>

          <Divider />

          <div>
            <p className="text-[11px] font-bold tracking-[0.14em] text-stone-400 uppercase">Resumen</p>
            <p className="mt-1.5 line-clamp-6 text-[13px] leading-relaxed whitespace-pre-line text-stone-600 dark:text-stone-300">
              {values.summary?.trim() || 'Aún no has escrito tu resumen.'}
            </p>
          </div>

          <Divider />

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-bold tracking-[0.14em] text-stone-400 uppercase">Experiencia</p>
              {experiences.length === 0 ? (
                <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400">
                  {values.noFormalExperience ? 'Sin experiencia formal (ruta de primer empleo).' : 'Sin registros.'}
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {experiences.slice(0, 4).map((item, index) => (
                    <li key={index} className="text-[12px] leading-snug">
                      <p className="font-semibold text-stone-800 dark:text-stone-200">{item.role}</p>
                      <p className="text-stone-500 dark:text-stone-400">
                        {item.company}
                        {item.start ? ` · ${item.start}` : ''}
                        {item.current ? ' — actualidad' : item.end ? ` a ${item.end}` : ''}
                      </p>
                    </li>
                  ))}
                  {experiences.length > 4 ? (
                    <li className="text-[11px] text-stone-400">+ {experiences.length - 4} más</li>
                  ) : null}
                </ul>
              )}
            </div>

            <div>
              <p className="text-[11px] font-bold tracking-[0.14em] text-stone-400 uppercase">Estudios</p>
              {education.length === 0 ? (
                <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400">
                  {values.noFormalEducation ? 'Sin estudios formales (formación complementaria).' : 'Sin registros.'}
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {education.slice(0, 3).map((item, index) => (
                    <li key={index} className="text-[12px] leading-snug">
                      <p className="font-semibold text-stone-800 dark:text-stone-200">{item.program}</p>
                      <p className="text-stone-500 dark:text-stone-400">
                        {item.institution}
                        {item.start ? ` · ${item.start}` : ''}
                        {item.current ? ' — en curso' : item.end ? ` a ${item.end}` : ''}
                      </p>
                    </li>
                  ))}
                  {education.length > 3 ? (
                    <li className="text-[11px] text-stone-400">+ {education.length - 3} más</li>
                  ) : null}
                </ul>
              )}
            </div>
          </div>

          <Divider />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-bold tracking-[0.14em] text-stone-400 uppercase">Habilidades</p>
              {technical.length + soft.length === 0 ? (
                <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400">Sin registros.</p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[...technical.map((item) => item.name), ...soft].slice(0, 12).map((name) => (
                    <span
                      key={name}
                      className="rounded-md bg-stone-100 px-2 py-1 text-[10.5px] font-medium text-stone-600 dark:bg-white/[0.06] dark:text-stone-300"
                    >
                      {name}
                    </span>
                  ))}
                  {technical.length + soft.length > 12 ? (
                    <span className="text-[10.5px] text-stone-400">+{technical.length + soft.length - 12}</span>
                  ) : null}
                </div>
              )}
            </div>
            <div>
              <p className="text-[11px] font-bold tracking-[0.14em] text-stone-400 uppercase">Idiomas</p>
              {languages.length === 0 ? (
                <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400">Sin registros.</p>
              ) : (
                <ul className="mt-2 space-y-1 text-[12px] text-stone-600 dark:text-stone-300">
                  {languages.map((item, index) => (
                    <li key={index} className="flex justify-between gap-3">
                      <span>{item.name === 'otro' ? item.other : item.name}</span>
                      <span className="font-medium text-stone-400">
                        {item.name === 'Español' && item.level === 'nativo' ? 'Nativo' : labelOf(LANGUAGE_LEVELS, item.level)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {projects.length + volunteering.length > 0 ? (
            <>
              <Divider />
              <div className="flex flex-wrap gap-2 text-[11.5px] text-stone-500 dark:text-stone-400">
                {projects.length > 0 ? <Badge tone="neutral">{projects.length} proyecto(s)</Badge> : null}
                {volunteering.length > 0 ? <Badge tone="neutral">{volunteering.length} voluntariado(s)</Badge> : null}
              </div>
            </>
          ) : null}
        </div>
      </Card>

      {missing.length > 0 ? (
        <Alert tone="warning" title="Antes de enviar">
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {missing.map((item) => (
              <li key={item.id}>
                <button type="button" className="underline underline-offset-2" onClick={() => onGoToStep(item.id)}>
                  {item.label}
                </button>{' '}
                — {item.hint}
              </li>
            ))}
          </ul>
        </Alert>
      ) : null}

      {submitError ? (
        <Alert tone="error" title="No pudimos guardar tu información">
          <p>{submitError.message}</p>
          {submitError.setupHint ? (
            <p className="mt-2 rounded-lg bg-red-950/5 px-3 py-2 font-mono text-[11px] dark:bg-black/30">
              Archivo: supabase/migrations/0001_formulario_cv.sql
            </p>
          ) : null}
          <p className="mt-2 text-[12px]">Tu información sigue en este navegador. Puedes corregir y reintentar.</p>
        </Alert>
      ) : null}

      <Card className="space-y-5 p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
            <ShieldCheck className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-stone-900 dark:text-white">Autorización y cierre</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-stone-500 dark:text-stone-400">
              Necesitamos tu autorización para tratar los datos. Puedes leer el detalle completo antes de aceptar.
            </p>
          </div>
        </div>

        <CheckboxField
          label="Autorizo el tratamiento de mis datos personales"
          description={CONSENT_TEXT}
          error={consentError}
          {...register('consent')}
        />

        <button
          type="button"
          onClick={onOpenPrivacy}
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-brand-700 hover:underline dark:text-brand-400"
        >
          Leer la política de privacidad completa
          <ArrowRight className="size-3.5" aria-hidden />
        </button>

        <CheckboxField
          label="Quiero recibir consejos y novedades de CVDigital"
          description="Es opcional, no afecta tu CV y puedes retirarlo cuando quieras."
          {...register('marketingOptIn')}
        />

        <CheckboxField
          label="Confirmo que la información es veraz"
          description="Revisa fechas, cargos y logros. Cualquier dato falso puede afectar tu proceso."
          error={truthError}
          {...register('truthConfirmed')}
        />

        <TextAreaField
          label="¿Algo que debamos saber?"
          rows={3}
          placeholder="Quiero destacar mi experiencia en sector salud y omitir el rol de 2015."
          help="Cuéntanos si hay algo que debamos resaltar o evitar. No prometemos omitir datos verificables."
          maxLength={1200}
          error={errors.teamNotes?.message}
          {...register('teamNotes')}
        />

        <p className="text-[11px] leading-relaxed text-stone-400 dark:text-stone-500">
          Al enviar, tu información se guarda en Supabase y queda disponible solo para el equipo de CVDigital. Solicitudes
          de acceso o eliminación: <span className="font-medium">{PRIVACY_CONTACT}</span>.
        </p>
      </Card>

      <div className="flex items-center gap-2 rounded-xl bg-stone-100/70 px-4 py-3 text-[11.5px] text-stone-500 dark:bg-white/[0.04] dark:text-stone-400">
        <Sparkles className="size-3.5 shrink-0 text-accent-600 dark:text-accent-400" aria-hidden />
        Después de enviar recibirás un folio. Guarda ese número para cualquier consulta.
      </div>

      {errors.root ? <Alert tone="error">{errors.root.message}</Alert> : null}
    </div>
  );
}


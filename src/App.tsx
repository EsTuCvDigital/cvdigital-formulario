import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch, type FieldErrors } from 'react-hook-form';
import { ArrowLeft, ArrowRight, Loader2, Save, Send, ShieldCheck } from 'lucide-react';
import { cvSchema, createEmptyValues, type CvValues } from '@/lib/schema';
import { STEP_FIELDS, orderedSteps, type StepId } from '@/lib/steps';
import { AUTOSAVE_MS, SERVICE_NAME } from '@/lib/constants';
import { clearDraft, hasContent, loadDraft, saveDraft, type Draft } from '@/lib/draft';
import { isSupabaseConfigured } from '@/lib/supabase';
import { submitCv, type SubmitFailure, type SubmitSuccess } from '@/lib/submit';
import { Footer, Header } from '@/components/Shell';
import { MobileProgress, Stepper } from '@/components/Stepper';
import { PrivacyDialog } from '@/components/PrivacyDialog';
import { Button, Card, IconButton, StepHeader, Toast } from '@/components/ui';
import { Welcome } from '@/screens/Welcome';
import { Success } from '@/screens/Success';
import { ContactStep } from '@/steps/ContactStep';
import { ProfileStep } from '@/steps/ProfileStep';
import { ExperienceStep } from '@/steps/ExperienceStep';
import { EducationStep } from '@/steps/EducationStep';
import { SkillsStep } from '@/steps/SkillsStep';
import { ProjectsStep } from '@/steps/ProjectsStep';
import { ReferencesStep } from '@/steps/ReferencesStep';
import { ReviewStep } from '@/steps/ReviewStep';
import type { StepProps } from '@/steps/types';

type Phase = 'welcome' | 'form' | 'success';
type ToastState = { id: number; message: string; tone: 'success' | 'error' | 'info' };

export default function App() {
  const form = useForm<CvValues>({
    resolver: zodResolver(cvSchema),
    defaultValues: createEmptyValues(),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    shouldFocusError: false,
    shouldUnregister: false,
  });

  const [phase, setPhase] = useState<Phase>('welcome');
  const [currentId, setCurrentId] = useState<StepId>('contact');
  const [visited, setVisited] = useState<Set<StepId>>(new Set<StepId>(['contact']));
  const [draft, setDraft] = useState<Draft | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<SubmitFailure | null>(null);
  const [success, setSuccess] = useState<SubmitSuccess | null>(null);
  const [submittedValues, setSubmittedValues] = useState<CvValues | null>(null);

  const autosaveTimer = useRef<number | undefined>(undefined);
  const level = useWatch({ control: form.control, name: 'level' });
  const steps = useMemo(() => orderedSteps(level), [level]);
  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === currentId),
  );
  const currentStep = steps[currentIndex] ?? steps[0];
  const isFirst = currentIndex <= 0;
  const isLast = currentIndex === steps.length - 1;
  const maxVisitedIndex = useMemo(
    () => Math.max(0, ...steps.map((step, index) => (visited.has(step.id) ? index : -1))),
    [steps, visited],
  );

  const notify = useCallback((message: string, tone: ToastState['tone'] = 'success') => {
    setToast({ id: Date.now() + Math.random(), message, tone });
  }, []);

  const markVisited = useCallback((id: StepId) => {
    setVisited((previous) => {
      if (previous.has(id)) return previous;
      const next = new Set(previous);
      next.add(id);
      return next;
    });
  }, []);

  const saveNow = useCallback(() => {
    const values = form.getValues();
    if (!hasContent(values)) return false;
    const ok = saveDraft(currentIndex, values);
    if (ok) setSavedAt(Date.now());
    return ok;
  }, [currentIndex, form]);

  /* Draft precargado ------------------------------------------------------- */
  useEffect(() => {
    const stored = loadDraft();
    if (stored && hasContent(stored.values)) setDraft(stored);
  }, []);

  /* Autoguardado ----------------------------------------------------------- */
  useEffect(() => {
    if (phase !== 'form') return;
    const subscription = form.watch(() => {
      window.clearTimeout(autosaveTimer.current);
      autosaveTimer.current = window.setTimeout(() => {
        const values = form.getValues();
        if (!hasContent(values)) {
          clearDraft();
          setSavedAt(null);
          return;
        }
        if (saveDraft(currentIndex, values)) setSavedAt(Date.now());
      }, AUTOSAVE_MS);
    });
    return () => {
      subscription.unsubscribe();
      window.clearTimeout(autosaveTimer.current);
    };
  }, [phase, currentIndex, form]);

  /* Foco y scroll al cambiar de paso --------------------------------------- */
  useEffect(() => {
    if (phase !== 'form') return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const heading = document.getElementById('step-title');
    heading?.focus({ preventScroll: true });
  }, [currentId, phase]);

  useEffect(() => {
    const base = `${SERVICE_NAME} · Formulario de perfil`;
    document.title =
      phase === 'form' ? `${currentStep.title} · ${base}` : phase === 'success' ? `Solicitud recibida · ${base}` : base;
  }, [phase, currentStep.title]);

  const focusFirstInvalid = () => {
    window.setTimeout(() => {
      const element = document.querySelector<HTMLElement>('[aria-invalid="true"]');
      if (!element) return;
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.focus({ preventScroll: true });
    }, 80);
  };

  const goNext = async () => {
    const fields = STEP_FIELDS[currentStep.id];
    const ok = await form.trigger(fields as never, { shouldFocus: false });
    if (!ok) {
      notify('Revisa los campos marcados en rojo antes de continuar.', 'error');
      focusFirstInvalid();
      return;
    }
    saveNow();
    const next = steps[currentIndex + 1];
    if (next) {
      setCurrentId(next.id);
      markVisited(next.id);
    }
  };

  const goBack = () => {
    const previous = steps[currentIndex - 1];
    if (previous) setCurrentId(previous.id);
  };

  const goToStep = (id: StepId) => {
    if (id === currentId) return;
    if (!visited.has(id)) return;
    setCurrentId(id);
  };

  const onInvalid = (errors: FieldErrors<CvValues>) => {
    const first = steps.find((step) =>
      STEP_FIELDS[step.id].some((field) => Boolean(errors[field as keyof FieldErrors<CvValues>])),
    );
    if (first) {
      setCurrentId(first.id);
      markVisited(first.id);
    }
    notify('Faltan datos obligatorios. Revisa los campos marcados en rojo.', 'error');
    focusFirstInvalid();
  };

  const submit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    setSubmitError(null);
    const result = await submitCv(values);
    setSubmitting(false);

    if (result.ok) {
      clearDraft();
      setDraft(null);
      setSavedAt(null);
      setToast(null);
      setSuccess(result);
      setSubmittedValues(values);
      setPhase('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitError(result);
    notify(result.message, 'error');
  }, onInvalid);

  const startFresh = () => {
    clearDraft();
    form.reset(createEmptyValues());
    setDraft(null);
    setSavedAt(null);
    setSubmitError(null);
    setCurrentId('contact');
    setVisited(new Set<StepId>(['contact']));
    setPhase('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resumeDraft = () => {
    if (!draft) {
      startFresh();
      return;
    }
    form.reset(draft.values);
    const draftSteps = orderedSteps(draft.values.level);
    const index = Math.min(Math.max(draft.stepIndex, 0), draftSteps.length - 1);
    const target = draftSteps[index];
    setCurrentId(target.id);
    setVisited(new Set(draftSteps.slice(0, index + 1).map((step) => step.id)));
    setSavedAt(draft.savedAt);
    setSubmitError(null);
    setDraft(null);
    setPhase('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetAll = useCallback(() => {
    clearDraft();
    form.reset(createEmptyValues());
    setDraft(null);
    setSavedAt(null);
    setSuccess(null);
    setSubmittedValues(null);
    setSubmitError(null);
    setCurrentId('contact');
    setVisited(new Set<StepId>(['contact']));
    setPhase('welcome');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [form]);

  const handleHome = () => {
    if (phase === 'form') {
      saveNow();
      const stored = loadDraft();
      setDraft(stored && hasContent(stored.values) ? stored : null);
      setPhase('welcome');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (phase === 'success') {
      resetAll();
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveAndExit = () => {
    const ok = saveNow();
    const stored = loadDraft();
    setDraft(stored && hasContent(stored.values) ? stored : null);
    setPhase('welcome');
    notify(
      ok
        ? 'Borrador guardado en este dispositivo. Puedes continuar cuando quieras.'
        : 'Todavía no hay información que guardar.',
      ok ? 'success' : 'info',
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const stepProps: StepProps = {
    form,
    notify,
    onOpenPrivacy: () => setPrivacyOpen(true),
    onGoToStep: goToStep,
  };

  const renderStep = () => {
    switch (currentId) {
      case 'contact':
        return <ContactStep {...stepProps} />;
      case 'profile':
        return <ProfileStep {...stepProps} />;
      case 'experience':
        return <ExperienceStep {...stepProps} />;
      case 'education':
        return <EducationStep {...stepProps} />;
      case 'skills':
        return <SkillsStep {...stepProps} />;
      case 'projects':
        return <ProjectsStep {...stepProps} />;
      case 'references':
        return <ReferencesStep {...stepProps} />;
      case 'review':
        return <ReviewStep {...stepProps} submitError={submitError} configured={isSupabaseConfigured} />;
      default:
        return <ContactStep {...stepProps} />;
    }
  };

  const primaryLabel = isLast ? 'Enviar mi información' : 'Continuar';

  const handleKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    const target = event.target as HTMLElement;
    if (['TEXTAREA', 'BUTTON', 'A', 'SELECT'].includes(target.tagName)) return;
    const type = target.getAttribute('type');
    if (type === 'checkbox' || type === 'radio') return;
    if (isLast) return;
    event.preventDefault();
    void goNext();
  };

  return (
    <div className="app-shell relative flex min-h-screen flex-col">
      <div aria-hidden className="grid-lines pointer-events-none absolute inset-0 opacity-50" />

      <Header
        phase={phase}
        savedAt={savedAt}
        onHome={handleHome}
        onOpenPrivacy={() => setPrivacyOpen(true)}
      />

      {!isSupabaseConfigured ? (
        <div className="relative border-b border-amber-200/70 bg-amber-50/85 px-4 py-2 text-center text-[11.5px] text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          Modo local sin Supabase. Completa <code className="font-mono font-semibold">.env.local</code> y reinicia{' '}
          <code className="font-mono font-semibold">npm run dev</code> para guardar los CV.
        </div>
      ) : null}

      <main className="relative flex-1">
        {phase === 'welcome' ? (
          <Welcome
            draft={draft}
            onStart={draft ? resumeDraft : startFresh}
            onResume={resumeDraft}
            onRestart={startFresh}
            onOpenPrivacy={() => setPrivacyOpen(true)}
          />
        ) : null}

        {phase === 'form' ? (
          <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-6 pb-32 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10 lg:pt-10 lg:pb-16">
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-5">
                <Stepper
                  steps={steps}
                  currentIndex={currentIndex}
                  maxVisited={maxVisitedIndex}
                  onSelect={(index) => {
                    const target = steps[index];
                    if (target) goToStep(target.id);
                  }}
                />
                <Card className="space-y-2 p-4">
                  <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-stone-700 dark:text-stone-200">
                    <ShieldCheck className="size-3.5 text-brand-700 dark:text-brand-400" aria-hidden />
                    Privacidad
                  </p>
                  <p className="text-[11px] leading-relaxed text-stone-500 dark:text-stone-400">
                    Solo usamos tus datos para escribir tu CV. Sin foto, cédula ni datos sensibles.
                  </p>
                  <button
                    type="button"
                    onClick={() => setPrivacyOpen(true)}
                    className="text-[11px] font-semibold text-brand-700 hover:underline dark:text-brand-400"
                  >
                    Leer la política
                  </button>
                </Card>
                <p className="px-2 text-[10.5px] leading-relaxed text-stone-400 dark:text-stone-500">
                  Guardado automático activo. Puedes cerrar y volver desde el mismo dispositivo.
                </p>
              </div>
            </aside>

            <section className="min-w-0">
              <MobileProgress steps={steps} currentIndex={currentIndex} />

              <form
                onSubmit={submit}
                onKeyDown={handleKeyDown}
                noValidate
                className="mt-6 lg:mt-0"
                aria-label="Formulario de perfil profesional"
              >
                <StepHeader
                  eyebrow={`Paso ${currentIndex + 1} de ${steps.length}`}
                  title={currentStep.title}
                  intro={currentStep.intro}
                />

                <div key={currentId} className="mt-7 animate-rise">
                  {renderStep()}
                </div>

                {/* Honeypot */}
                <div aria-hidden className="pointer-events-none absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
                  <label htmlFor="empresa-website">No completar este campo</label>
                  <input id="empresa-website" tabIndex={-1} autoComplete="off" {...form.register('honeypot')} />
                </div>

                {/* Navegación escritorio */}
                <nav className="mt-9 hidden items-center gap-2 border-t border-stone-200 pt-5 lg:flex dark:border-white/10">
                  {!isFirst ? (
                    <Button variant="ghost" onClick={goBack} icon={<ArrowLeft className="size-4" aria-hidden />}>
                      Atrás
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={saveAndExit}
                    icon={<Save className="size-3.5" aria-hidden />}
                  >
                    Guardar y salir
                  </Button>
                  <div className="ml-auto flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={isLast ? () => void submit() : () => void goNext()}
                      loading={submitting}
                      size="lg"
                      icon={isLast ? <Send className="size-4" aria-hidden /> : <ArrowRight className="size-4" aria-hidden />}
                    >
                      {primaryLabel}
                    </Button>
                  </div>
                </nav>

                {/* Navegación móvil */}
                <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200/80 bg-white/90 px-4 py-3 backdrop-blur-lg lg:hidden dark:border-white/10 dark:bg-[#0b100e]/90">
                  <div className="mx-auto flex max-w-lg items-center gap-2">
                    <IconButton
                      onClick={goBack}
                      disabled={isFirst}
                      aria-label="Volver al paso anterior"
                      className="size-11 shrink-0 disabled:opacity-30"
                    >
                      <ArrowLeft className="size-5" aria-hidden />
                    </IconButton>
                    <div className="min-w-0 flex-1 text-center">
                      <p className="text-[10px] font-semibold tracking-wider text-stone-400 uppercase">
                        Paso {currentIndex + 1} de {steps.length}
                      </p>
                      <p className="truncate text-[12px] font-semibold text-stone-700 dark:text-stone-200">
                        {currentStep.short}
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={isLast ? () => void submit() : () => void goNext()}
                      loading={submitting}
                      className="min-w-[7.5rem]"
                      icon={isLast ? <Send className="size-4" aria-hidden /> : undefined}
                    >
                      {isLast ? 'Enviar' : 'Continuar'}
                    </Button>
                  </div>
                </div>
              </form>

              {phase === 'form' ? (
                <p className="mt-6 hidden text-center text-[10.5px] text-stone-400 lg:block dark:text-stone-500">
                  Tu avance se guarda en este navegador. No compartas este dispositivo si hay información sensible.
                </p>
              ) : null}
            </section>
          </div>
        ) : null}

        {phase === 'success' && success && submittedValues ? (
          <Success
            result={success}
            values={submittedValues}
            onReset={resetAll}
            onOpenPrivacy={() => setPrivacyOpen(true)}
          />
        ) : null}
      </main>

      <Footer onOpenPrivacy={() => setPrivacyOpen(true)} />

      <PrivacyDialog open={privacyOpen} onClose={() => setPrivacyOpen(false)} />

      {toast ? (
        <Toast key={toast.id} message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />
      ) : null}

      {submitting ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm dark:bg-black/50"
        >
          <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-5 py-4 text-sm font-medium text-stone-700 shadow-lift dark:border-white/10 dark:bg-[#111716] dark:text-stone-200">
            <Loader2 className="size-4 animate-spin text-brand-700" aria-hidden />
            Guardando tu información…
          </div>
        </div>
      ) : null}
    </div>
  );
}

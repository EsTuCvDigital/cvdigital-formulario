import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  Lock,
  PencilLine,
  ShieldCheck,
  Sparkles,
  BriefcaseBusiness,
} from 'lucide-react';
import type { Draft } from '@/lib/draft';
import { draftSummary } from '@/lib/draft';
import { Badge, Button, Card } from '@/components/ui';

function formatSavedAt(timestamp: number): string {
  try {
    return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toLocaleString();
  }
}

export function Welcome({
  draft,
  onStart,
  onResume,
  onRestart,
  onOpenPrivacy,
}: {
  draft: Draft | null;
  onStart: () => void;
  onResume: () => void;
  onRestart: () => void;
  onOpenPrivacy: () => void;
}) {
  return (
    <div className="animate-fade">
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-14 sm:px-6 lg:pt-16 lg:pb-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="brand">
                <Sparkles className="size-3" aria-hidden />
                Formulario guiado
              </Badge>
              <Badge>
                <Clock className="size-3" aria-hidden />8 a 12 minutos
              </Badge>
            </div>

            <h1 className="mt-5 font-display text-[clamp(2.35rem,5.6vw,4.1rem)] leading-[0.98] font-semibold tracking-[-0.02em] text-stone-950 text-balance dark:text-white">
              Tu experiencia,
              <span className="block text-brand-700 dark:text-brand-400">bien contada.</span>
            </h1>

            <p className="mt-5 max-w-xl text-[15.5px] leading-relaxed text-stone-600 dark:text-stone-400">
              Cuéntanos tu trayectoria en un formulario claro, con ejemplos y sin jerga. Con esa información escribimos
              tu hoja de vida profesional. Sirve si buscas tu primer empleo, si cambias de carrera o si llevas años
              dirigiendo equipos.
            </p>

            {draft ? (
              <Card className="mt-6 border-brand-200/80 bg-brand-50/40 p-4 dark:border-brand-500/20 dark:bg-brand-500/[0.06]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-brand-700 shadow-sm dark:bg-white/10 dark:text-brand-300">
                      <PencilLine className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-stone-900 dark:text-white">
                        Tienes un borrador: {draftSummary(draft)}
                      </p>
                      <p className="text-[11.5px] text-stone-500 dark:text-stone-400">
                        Guardado el {formatSavedAt(draft.savedAt)} en este dispositivo.
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2 sm:ml-auto">
                    <Button size="sm" onClick={onResume}>
                      Continuar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={onRestart}>
                      Empezar de cero
                    </Button>
                  </div>
                </div>
              </Card>
            ) : null}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button size="lg" onClick={onStart} icon={<ArrowRight className="size-4.5" aria-hidden />}>
                {draft ? 'Continuar mi CV' : 'Empezar mi CV'}
              </Button>
              <button
                type="button"
                onClick={onOpenPrivacy}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[13px] font-semibold text-stone-600 transition hover:bg-white/60 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-white/[0.05] dark:hover:text-white"
              >
                <ShieldCheck className="size-4 text-brand-700 dark:text-brand-400" aria-hidden />
                Cómo protegemos tus datos
              </button>
            </div>

            <ul className="mt-7 grid gap-2.5 text-[12.5px] text-stone-600 dark:text-stone-400 sm:grid-cols-3">
              {[
                ['Sin foto ni cédula', 'Solo datos profesionales'],
                ['Se adapta a ti', 'Primer empleo o seniority'],
                ['Guardado automático', 'Sigue después si cierras'],
              ].map(([title, description]) => (
                <li key={title} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-brand-600 dark:text-brand-400" aria-hidden />
                  <span>
                    <span className="block font-semibold text-stone-800 dark:text-stone-200">{title}</span>
                    <span className="block text-[11px]">{description}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Mockup */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div
              aria-hidden
              className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-tr from-brand-200/50 via-transparent to-accent-400/30 blur-2xl dark:from-brand-800/40 dark:to-amber-900/30"
            />
            <div className="relative rotate-[-1.5deg] rounded-2xl border border-stone-200/80 bg-white p-6 shadow-lift transition-transform duration-500 hover:rotate-0 dark:border-white/10 dark:bg-[#111716]">
              <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-4 dark:border-white/[0.07]">
                <div>
                  <p className="font-display text-xl leading-tight font-semibold text-stone-900 dark:text-white">
                    Ana María Gómez
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold tracking-wide text-brand-700 uppercase dark:text-brand-400">
                    Analista de datos · salud
                  </p>
                  <p className="mt-1.5 text-[10px] text-stone-400">Medellín, Colombia · ana@correo.com</p>
                </div>
                <span className="flex size-9 items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                  CV
                </span>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-[9px] font-bold tracking-[0.18em] text-stone-400 uppercase">Perfil</p>
                  <div className="mt-1.5 space-y-1">
                    <span className="block h-1.5 w-full rounded-full bg-stone-100 dark:bg-white/10" />
                    <span className="block h-1.5 w-[92%] rounded-full bg-stone-100 dark:bg-white/10" />
                    <span className="block h-1.5 w-[78%] rounded-full bg-stone-100 dark:bg-white/10" />
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-bold tracking-[0.18em] text-stone-400 uppercase">Experiencia</p>
                  <div className="mt-2 space-y-2.5">
                    {[
                      ['Analista de datos', 'Clínica del Norte · 2022 — actualidad'],
                      ['Auxiliar de investigación', 'Universidad de Antioquia · 2020 — 2022'],
                    ].map(([role, detail]) => (
                      <div key={role} className="border-l-2 border-brand-200 pl-2.5 dark:border-brand-500/30">
                        <p className="text-[10.5px] font-semibold text-stone-700 dark:text-stone-200">{role}</p>
                        <p className="text-[9px] text-stone-400">{detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-bold tracking-[0.18em] text-stone-400 uppercase">Habilidades</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {['SQL', 'Power BI', 'Python', 'Comunicación', 'Scrum'].map((skill) => (
                      <span
                        key={skill}
                        className="rounded bg-stone-100 px-1.5 py-0.5 text-[8.5px] font-medium text-stone-500 dark:bg-white/[0.07] dark:text-stone-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -top-3 -right-2 rotate-2 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-stone-600 shadow-soft dark:border-white/10 dark:bg-[#151c1a] dark:text-stone-300">
              <span className="mr-1 inline-block size-1.5 rounded-full bg-brand-500" />
              Apto para ATS
            </div>
            <div className="absolute -bottom-3 -left-2 -rotate-2 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-stone-600 shadow-soft dark:border-white/10 dark:bg-[#151c1a] dark:text-stone-300">
              <Lock className="mr-1 inline size-3 text-brand-600" aria-hidden />
              Tus datos, bajo control
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="border-y border-stone-200/70 bg-white/50 dark:border-white/[0.07] dark:bg-white/[0.02]">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:px-6 md:grid-cols-3">
          {[
            {
              icon: FileText,
              title: 'Preguntas con ejemplo',
              text: 'Cada campo trae una guía y un ejemplo real para que no te quedes en blanco.',
            },
            {
              icon: GraduationCap,
              title: 'Para cualquier punto de partida',
              text: 'Si no tienes experiencia formal, el formulario te muestra cómo usar proyectos, prácticas y voluntariado.',
            },
            {
              icon: ShieldCheck,
              title: 'Privacidad por diseño',
              text: 'Sin foto, cédula ni datos sensibles. Tú autorizas el tratamiento y puedes pedir la eliminación.',
            },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
                <Icon className="size-4.5" aria-hidden />
              </span>
              <div>
                <p className="text-[13.5px] font-semibold text-stone-900 dark:text-white">{title}</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-stone-500 dark:text-stone-400">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cierre */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-6 rounded-2xl border border-stone-200/80 bg-white/70 p-6 shadow-soft dark:border-white/10 dark:bg-white/[0.03] sm:p-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="text-[11px] font-bold tracking-[0.16em] text-brand-700 uppercase dark:text-brand-400">
              Antes de empezar
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-stone-900 dark:text-white">
              Ten a mano fechas, cargos y logros
            </h2>
            <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-stone-600 dark:text-stone-400">
              No necesitas tenerlo perfecto: puedes guardar y continuar después. Si no recuerdas una cifra, describe el
              alcance o el resultado. Lo importante es que sea verdad.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-[11.5px] text-stone-500 dark:text-stone-400">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 dark:bg-white/[0.06]">
                <BriefcaseBusiness className="size-3" aria-hidden /> Experiencia o proyectos
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 dark:bg-white/[0.06]">
                <GraduationCap className="size-3" aria-hidden /> Estudios o formación
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 dark:bg-white/[0.06]">
                <Sparkles className="size-3" aria-hidden /> Habilidades e idiomas
              </span>
            </div>
          </div>
          <div className="flex flex-col items-stretch gap-2 lg:items-end">
            <Button size="lg" onClick={onStart} icon={<ArrowRight className="size-4.5" aria-hidden />}>
              {draft ? 'Continuar mi CV' : 'Comenzar ahora'}
            </Button>
            <p className="text-center text-[11px] text-stone-400 lg:text-right">
              Sin registro. Puedes guardar y volver cuando quieras.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

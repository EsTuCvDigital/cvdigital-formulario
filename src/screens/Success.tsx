import { useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  Mail,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import type { CvValues } from '@/lib/schema';
import type { SubmitSuccess } from '@/lib/submit';
import { buildPayloadForExport } from '@/lib/submit';
import { PRIVACY_CONTACT, PRIVACY_RETENTION } from '@/lib/constants';
import { downloadJson } from '@/lib/utils';
import { Badge, Button, Card } from '@/components/ui';

export function Success({
  result,
  values,
  onReset,
  onOpenPrivacy,
}: {
  result: SubmitSuccess;
  values: CvValues;
  onReset: () => void;
  onOpenPrivacy: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyFolio = async () => {
    try {
      await navigator.clipboard.writeText(result.publicId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const download = () => {
    downloadJson(`CV-${result.publicId}.json`, {
      folio: result.publicId,
      enviadoEn: new Date().toISOString(),
      ...buildPayloadForExport(values),
    });
  };

  const experienceCount = values.experiences.length;
  const educationCount = values.education.length;
  const skillCount = values.technicalSkills.length + values.softSkills.length;

  return (
    <div className="animate-fade">
      <section className="mx-auto max-w-3xl px-4 pt-12 pb-10 text-center sm:px-6 lg:pt-20">
        <div className="relative mx-auto flex size-16 items-center justify-center">
          <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-brand-400/25 [animation-duration:2.2s]" />
          <span className="relative flex size-16 items-center justify-center rounded-full bg-brand-700 text-white shadow-lift">
            <Check className="size-8" aria-hidden />
          </span>
        </div>

        <Badge tone="success" className="mt-5">
          <CheckCircle2 className="size-3" aria-hidden />
          Solicitud recibida
        </Badge>

        <h1 className="mt-4 font-display text-[clamp(2rem,5vw,3.2rem)] leading-[1.03] font-semibold tracking-tight text-stone-950 text-balance dark:text-white">
          Recibimos tu información{values.fullName ? `, ${values.fullName.split(' ')[0]}` : ''}.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[14.5px] leading-relaxed text-stone-600 dark:text-stone-400">
          El equipo de CVDigital revisará tu perfil y te contactará a <span className="font-semibold">{values.email}</span>{' '}
          o al teléfono que registraste. Guarda tu folio para cualquier consulta.
        </p>

        <Card className="mx-auto mt-7 max-w-md p-4">
          <p className="text-[10.5px] font-bold tracking-[0.18em] text-stone-400 uppercase">Tu folio</p>
          <div className="mt-1 flex items-center justify-center gap-3">
            <p className="font-mono text-2xl font-bold tracking-tight text-stone-900 dark:text-white">{result.publicId}</p>
            <button
              type="button"
              onClick={copyFolio}
              className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-2 py-1 text-[11px] font-semibold text-stone-600 transition hover:bg-stone-50 dark:border-white/10 dark:text-stone-300 dark:hover:bg-white/5"
            >
              {copied ? <Check className="size-3 text-brand-600" aria-hidden /> : <Copy className="size-3" aria-hidden />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-stone-400">También guardamos este número en tu copia descargable.</p>
        </Card>

        <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
          <Button onClick={download} variant="secondary" icon={<Download className="size-4" aria-hidden />}>
            Descargar copia (JSON)
          </Button>
          <Button onClick={onReset} icon={<RefreshCw className="size-4" aria-hidden />}>
            Enviar otra respuesta
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-14 sm:px-6">
        <Card className="overflow-hidden">
          <div className="border-b border-stone-100 px-5 py-3.5 dark:border-white/[0.06]">
            <p className="text-[13px] font-semibold text-stone-800 dark:text-stone-200">Qué pasa ahora</p>
          </div>
          <ol className="divide-y divide-stone-100 dark:divide-white/[0.06]">
            {[
              {
                icon: FileText,
                title: 'Revisamos tu información',
                text: 'Validamos fechas, cargos y logros, y armamos la estructura del CV.',
              },
              {
                icon: Mail,
                title: 'Te contactamos',
                text: 'Si falta un dato o hay algo que aclarar, te escribimos por correo o teléfono.',
              },
              {
                icon: ArrowRight,
                title: 'Entregamos y ajustamos',
                text: 'Recibes tu hoja de vida y un espacio para correcciones.',
              },
            ].map(({ icon: Icon, title, text }, index) => (
              <li key={title} className="flex items-start gap-3.5 px-5 py-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
                  {index + 1}
                </span>
                <div>
                  <p className="flex items-center gap-1.5 text-[13px] font-semibold text-stone-800 dark:text-stone-100">
                    <Icon className="size-3.5 text-stone-400" aria-hidden />
                    {title}
                  </p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-stone-500 dark:text-stone-400">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            [experienceCount, 'experiencia(s)'],
            [educationCount, 'estudio(s)'],
            [skillCount, 'habilidad(es)'],
          ].map(([count, label]) => (
            <div
              key={String(label)}
              className="rounded-xl border border-stone-200 bg-white/70 p-3 text-center dark:border-white/10 dark:bg-white/[0.03]"
            >
              <p className="font-display text-xl font-semibold text-stone-900 dark:text-white">{count}</p>
              <p className="text-[10.5px] text-stone-500 dark:text-stone-400">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-xl border border-stone-200 bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.02]">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-700 dark:text-brand-400" aria-hidden />
          <div className="text-[11.5px] leading-relaxed text-stone-500 dark:text-stone-400">
            <p>
              <span className="font-semibold text-stone-700 dark:text-stone-300">Privacidad:</span> conservamos tu
              información mientras la solicitud esté activa y hasta 12 meses después de la última interacción. Los
              borradores locales se eliminan a los 90 días. {PRIVACY_RETENTION.location}
            </p>
            <p className="mt-1.5">
              Para acceso, rectificación, supresión o revocatoria escribe a{' '}
              <span className="font-semibold text-stone-700 dark:text-stone-300">{PRIVACY_CONTACT}</span> con tu folio.
            </p>
            <button
              type="button"
              onClick={onOpenPrivacy}
              className="mt-1.5 font-semibold text-brand-700 hover:underline dark:text-brand-400"
            >
              Ver política de privacidad
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

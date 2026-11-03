import { useWatch } from 'react-hook-form';
import { BookOpen, Sparkles, Wand2 } from 'lucide-react';
import {
  ACTION_VERBS,
  AVAILABILITY,
  CV_LANGUAGES,
  LEVELS,
  MODALITIES,
  RELOCATION,
  SCHEDULES,
  TRAVEL,
} from '@/lib/options';
import { estimateYears } from '@/lib/utils';
import {
  Alert,
  Badge,
  Button,
  Card,
  CheckGroup,
  Collapsible,
  NumberField,
  RadioCardGroup,
  SelectField,
  TextAreaField,
  TextField,
} from '@/components/ui';
import type { StepProps } from './types';

const LEVEL_TIPS: Record<string, string> = {
  estudiante:
    'Tus estudios y proyectos son tu experiencia por ahora. En el resumen destaca lo que aprendiste, las herramientas que usas y lo que puedes aportar.',
  primer_empleo:
    'Todo cuenta: prácticas, voluntariado, freelance y proyectos. Enfoca el resumen en tus capacidades y en cómo aportas desde el primer día.',
  junior: 'Muestra resultados, no solo tareas. Describe qué mejoraste, con qué herramientas y qué cambió gracias a tu trabajo.',
  intermedio: 'Demuestra impacto y profundidad: alcance, métricas y especialización en tu área.',
  senior: 'Menos tareas, más impacto y escala: equipos, presupuesto, regiones, procesos y transformaciones.',
  ejecutivo: 'Habla de negocio: P&L, equipo, región, transformación y legado. Menos operación, más estrategia.',
  cambio_carrera:
    'Conecta lo que ya sabes con lo que quieres hacer. El resumen debe explicar la transición y por qué tu experiencia previa es un puente.',
};

const SUMMARY_TEMPLATE_SENIOR =
  '[Tu cargo actual] con [X] años de experiencia en [sector]. Logré [resultado 1 con cifra o alcance] y [resultado 2 con cifra o alcance]. Me caracterizo por [fortaleza 1] y [fortaleza 2]. Busco [tipo de rol] en [tipo de empresa] para aportar en [tema clave].';

const SUMMARY_TEMPLATE_FIRST =
  'Egresado(a) de [tu programa] con experiencia en [prácticas, proyectos o voluntariado]. En [proyecto o práctica] logré [resultado concreto]. Me caracterizo por [fortaleza 1] y [fortaleza 2]. Busco mi primer rol en [área] para aportar [tu aporte].';

export function ProfileStep({ form, notify }: StepProps) {
  const {
    register,
    setValue,
    control,
    formState: { errors },
  } = form;

  const level = useWatch({ control, name: 'level' });
  const summary = useWatch({ control, name: 'summary' }) ?? '';
  const years = useWatch({ control, name: 'years' }) ?? '';
  const experiences = useWatch({ control, name: 'experiences' }) ?? [];
  const estimated = estimateYears(experiences);
  const estimatedLabel = String(estimated).replace('.', ',');

  const isFirstJob = level === 'estudiante' || level === 'primer_empleo';
  const template = isFirstJob ? SUMMARY_TEMPLATE_FIRST : SUMMARY_TEMPLATE_SENIOR;
  const canInsertTemplate = summary.trim().length < 20;

  const insertTemplate = () => {
    setValue('summary', template, { shouldValidate: true, shouldDirty: true });
    notify('Plantilla insertada. Reemplaza los textos entre corchetes con tu información.', 'info');
  };

  const applyEstimate = () => {
    setValue('years', String(estimated), { shouldValidate: true, shouldDirty: true });
    notify(`Años de experiencia actualizados a ${estimatedLabel}.`, 'success');
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <TextField
              label="Titular profesional (cargo objetivo)"
              required
              placeholder="Analista de datos con enfoque en salud"
              help="Cargo objetivo + especialidad. No escribas “busco empleo” ni “disponible”."
              maxLength={160}
              error={errors.headline?.message}
              {...register('headline')}
            />
          </div>
          <SelectField
            label="¿En qué idioma quieres tu CV?"
            required
            options={CV_LANGUAGES}
            hint="Si eliges ambos, entregamos dos versiones separadas."
            error={errors.cvLanguage?.message}
            {...register('cvLanguage')}
          />
          <div>
            <NumberField
              label="Años de experiencia relevante"
              required
              min={0}
              max={60}
              step={1}
              suffix="años"
              help="Cuenta prácticas, freelance y experiencia informal. Si tienes menos de 1 año, escribe 0."
              error={errors.years?.message}
              {...register('years')}
            />
            {estimated > 0 && Number(years) !== estimated ? (
              <button
                type="button"
                onClick={applyEstimate}
                className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-brand-700 hover:underline dark:text-brand-400"
              >
                <Sparkles className="size-3.5" aria-hidden />
                Usar {estimatedLabel} años calculados desde tus fechas
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <RadioCardGroup
          control={control}
          name="level"
          label="¿En qué momento profesional estás?"
          help="Esto adapta el orden del formulario y el enfoque de tu CV."
          options={LEVELS}
          error={errors.level?.message}
        />
        {level && LEVEL_TIPS[level] ? <Alert tone="info">{LEVEL_TIPS[level]}</Alert> : null}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-[13.5px] font-semibold text-stone-800 dark:text-stone-200">Resumen profesional</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">4 a 6 líneas. Sin adjetivos vacíos.</p>
          </div>
          <Badge tone={summary.trim().length >= 150 ? 'success' : 'neutral'}>
            {summary.trim().length >= 150 ? 'Listo' : `${summary.trim().length}/150 mínimo`}
          </Badge>
        </div>

        <TextAreaField
          label="Tu resumen"
          required
          rows={6}
          placeholder="Escribe 4-6 líneas: rol, años, 2 logros, 2 fortalezas y qué buscas."
          help="Si no sabes qué escribir, abre la guía y usa la plantilla. Luego reemplaza los textos entre corchetes."
          maxLength={2000}
          currentLength={summary.length}
          limit={2000}
          error={errors.summary?.message}
          {...register('summary')}
        />

        {canInsertTemplate ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={insertTemplate}
            icon={<Wand2 className="size-4" aria-hidden />}
          >
            Insertar plantilla
          </Button>
        ) : null}

        <Collapsible title="Cómo escribir un resumen que funcione" icon={<BookOpen className="size-4" aria-hidden />}>
          <p className="font-medium text-stone-700 dark:text-stone-200">
            Fórmula: <span className="text-brand-700 dark:text-brand-400">rol objetivo + años + 2 logros + 2 fortalezas + qué buscas</span>
          </p>
          <div className="space-y-2">
            <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase">Ejemplo · primer empleo</p>
            <p className="rounded-lg bg-stone-50 p-3 text-[12.5px] italic dark:bg-white/[0.04]">
              Egresada de Administración de Empresas con experiencia en atención al cliente y manejo de Excel. En mis
              prácticas reduje el tiempo de respuesta a clientes de 48 a 24 horas y automaticé el registro de
              solicitudes. Me caracterizo por la organización y la comunicación clara. Busco mi primer rol en
              operaciones o servicio al cliente donde pueda aportar orden y trato cercano.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase">Ejemplo · senior</p>
            <p className="rounded-lg bg-stone-50 p-3 text-[12.5px] italic dark:bg-white/[0.04]">
              Gerente Comercial con 12 años de experiencia en consumo masivo y equipos de hasta 40 personas. Aumenté las
              ventas de la región Andina en 22% en dos años y reduje la rotación del equipo de 28% a 12%. Fortalezas en
              negociación con retail, planeación comercial y liderazgo. Busco un rol de dirección comercial con alcance
              regional.
            </p>
          </div>
          <div>
            <p className="mb-1.5 font-medium text-stone-700 dark:text-stone-200">Evita</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>“Soy proactivo”, “me considero”, “busco empleo”.</li>
              <li>Párrafos de 10 líneas o frases sin evidencia.</li>
              <li>Inventar cifras, cargos o certificaciones.</li>
            </ul>
          </div>
        </Collapsible>
      </section>

      <Collapsible
        title="¿Aplicas a una vacante específica? (opcional)"
        icon={<Sparkles className="size-4" aria-hidden />}
      >
        <p>Si nos compartes la vacante, adaptamos las palabras clave del CV. No la publicamos.</p>
        <div className="grid gap-4">
          <TextField
            label="Enlace de la vacante"
            type="url"
            inputMode="url"
            placeholder="https://empresa.com/vacante"
            maxLength={400}
            error={errors.jobUrl?.message}
            {...register('jobUrl')}
          />
          <TextAreaField
            label="Descripción de la vacante"
            rows={4}
            placeholder="Pega aquí el anuncio si no tienes el enlace."
            maxLength={3000}
            error={errors.jobDescription?.message}
            {...register('jobDescription')}
          />
        </div>
      </Collapsible>

      <section className="space-y-4">
        <h3 className="text-[13px] font-bold tracking-[0.12em] text-stone-400 uppercase dark:text-stone-500">
          Disponibilidad
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Disponibilidad"
            required
            options={AVAILABILITY}
            error={errors.availability?.message}
            {...register('availability')}
          />
          <SelectField
            label="Tipo de jornada"
            required
            options={SCHEDULES}
            error={errors.schedule?.message}
            {...register('schedule')}
          />
        </div>
        <CheckGroup
          control={control}
          name="modalities"
          label="Modalidad de trabajo"
          help="Puedes elegir más de una."
          options={MODALITIES}
          error={errors.modalities?.message}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="¿Estás dispuesto a reubicarte?"
            options={RELOCATION}
            placeholder="Prefiero no decirlo"
            error={errors.relocation?.message}
            {...register('relocation')}
          />
          <SelectField
            label="¿Puedes viajar por trabajo?"
            options={TRAVEL}
            placeholder="Prefiero no decirlo"
            error={errors.travel?.message}
            {...register('travel')}
          />
        </div>
      </section>

      <Card className="p-4">
        <p className="text-xs font-semibold text-stone-700 dark:text-stone-200">Verbos que sí funcionan al describir logros</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ACTION_VERBS.slice(0, 18).map((verb) => (
            <span
              key={verb}
              className="rounded-md bg-stone-100 px-2 py-1 text-[11px] font-medium text-stone-600 dark:bg-white/[0.06] dark:text-stone-300"
            >
              {verb}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}

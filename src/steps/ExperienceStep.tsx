import { useRef } from 'react';
import { useFieldArray, useWatch } from 'react-hook-form';
import { ArrowRight, Lightbulb, Plus } from 'lucide-react';
import type { Experience } from '@/lib/schema';
import { emptyExperience } from '@/lib/schema';
import { EMPLOYMENT_TYPES, MODALITIES } from '@/lib/options';
import { estimateYears } from '@/lib/utils';
import {
  Alert,
  Badge,
  Button,
  Card,
  CheckboxField,
  Collapsible,
  EmptyState,
  InlineCheckbox,
  MonthField,
  RepeatableCard,
  SelectField,
  TextAreaField,
  TextField,
} from '@/components/ui';
import { p, type StepProps } from './types';

function ExperienceCard({
  form,
  index,
  onRemove,
}: {
  form: StepProps['form'];
  index: number;
  onRemove: () => void;
}) {
  const {
    register,
    setValue,
    control,
    formState: { errors },
  } = form;

  const itemErrors = errors.experiences?.[index];
  const current = useWatch({ control, name: p(`experiences.${index}.current`) }) === true;
  const company = useWatch({ control, name: p(`experiences.${index}.company`) }) as string | undefined;
  const role = useWatch({ control, name: p(`experiences.${index}.role`) }) as string | undefined;

  return (
    <RepeatableCard
      index={index}
      title={company?.trim() || 'Nueva experiencia'}
      subtitle={role?.trim() || 'Completa empresa, cargo y fechas'}
      onRemove={onRemove}
      removeLabel="Eliminar esta experiencia"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Empresa u organización"
          required
          placeholder="Banco Davivienda"
          help="Si fue freelance, escribe “Independiente”."
          maxLength={160}
          error={itemErrors?.company?.message}
          {...register(p(`experiences.${index}.company`))}
        />
        <TextField
          label="Cargo"
          required
          placeholder="Analista financiero"
          help="Usa el cargo real, no el que quisieras tener."
          maxLength={160}
          error={itemErrors?.role?.message}
          {...register(p(`experiences.${index}.role`))}
        />
        <SelectField
          label="Tipo de contrato"
          required
          options={EMPLOYMENT_TYPES}
          error={itemErrors?.employmentType?.message}
          {...register(p(`experiences.${index}.employmentType`))}
        />
        <SelectField
          label="Modalidad"
          required
          options={MODALITIES}
          error={itemErrors?.modality?.message}
          {...register(p(`experiences.${index}.modality`))}
        />
        <div className="sm:col-span-2">
          <TextField
            label="Ubicación del empleo"
            placeholder="Medellín, Colombia"
            help="Ciudad y país. Si fue remoto, escribe “Remoto”."
            maxLength={120}
            error={itemErrors?.location?.message}
            {...register(p(`experiences.${index}.location`))}
          />
        </div>
        <MonthField
          label="Fecha de inicio"
          required
          error={itemErrors?.start?.message}
          {...register(p(`experiences.${index}.start`))}
        />
        <div className="space-y-3">
          <MonthField
            label="Fecha de fin"
            required={!current}
            disabled={current}
            help={current ? 'Trabajo actual: no pedimos fecha de fin.' : undefined}
            error={itemErrors?.end?.message}
            {...register(p(`experiences.${index}.end`))}
          />
          <InlineCheckbox
            label="Actualmente trabajo aquí"
            checked={current}
            onChange={(event) => {
              setValue(p(`experiences.${index}.current`), event.target.checked, { shouldDirty: true });
              if (event.target.checked) setValue(p(`experiences.${index}.end`), '');
            }}
          />
        </div>
      </div>

      <TextAreaField
        label="Contexto del rol"
        rows={2}
        placeholder="Empresa del sector financiero con 200 empleados; equipo de 5 personas."
        help="Una frase de contexto. No repitas el cargo ni listes tareas."
        maxLength={800}
        error={itemErrors?.context?.message}
        {...register(p(`experiences.${index}.context`))}
      />

      <TextAreaField
        label="Logros del cargo"
        required
        rows={4}
        placeholder={
          'Reduje el cierre contable de 12 a 5 días automatizando 3 conciliaciones.\nAtendí 60 clientes diarios con 92% de satisfacción.'
        }
        help="Una línea por logro (1 a 6). Verbo + acción + resultado. Si no tienes métrica, usa alcance, volumen o frecuencia."
        maxLength={2400}
        error={itemErrors?.achievementsText?.message}
        {...register(p(`experiences.${index}.achievementsText`))}
      />

      <TextField
        label="Herramientas o metodologías"
        placeholder="Excel avanzado, SQL, Power BI, Scrum"
        help="Sepáralas con comas. Alimentan las palabras clave del CV."
        maxLength={300}
        error={itemErrors?.tools?.message}
        {...register(p(`experiences.${index}.tools`))}
      />
    </RepeatableCard>
  );
}

export function ExperienceStep({ form, notify, onGoToStep }: StepProps) {
  const {
    control,
    setValue,
    getValues,
    clearErrors,
    formState: { errors },
  } = form;

  const noFormal = useWatch({ control, name: 'noFormalExperience' }) === true;
  const experiences = useWatch({ control, name: 'experiences' }) ?? [];
  const estimated = estimateYears(experiences);
  const backup = useRef<Experience[]>([]);

  const { fields, append, remove } = useFieldArray({ control, name: 'experiences' });

  const handleToggle = (checked: boolean) => {
    if (checked) {
      backup.current = getValues('experiences');
      setValue('experiences', [], { shouldDirty: true });
      setValue('noFormalExperience', true, { shouldDirty: true });
      clearErrors('experiences');
    } else {
      setValue('noFormalExperience', false, { shouldDirty: true });
      setValue('experiences', backup.current.length ? backup.current : [], { shouldDirty: true });
    }
  };

  const addExperience = () => {
    append(emptyExperience());
    notify('Experiencia agregada. Completa empresa, cargo, fechas y al menos un logro.', 'success');
  };

  return (
    <div className="space-y-6">
      <CheckboxField
        label="Aún no tengo experiencia laboral formal"
        description="Marca esta casilla solo si no tienes prácticas, freelance ni trabajos informales. Te mostraremos alternativas para tu primer empleo."
        checked={noFormal}
        onChange={(event) => handleToggle(event.target.checked)}
      />

      {noFormal ? (
        <Card className="space-y-4 p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-500/15 text-accent-700 dark:text-accent-400">
              <Lightbulb className="size-4" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-stone-900 dark:text-white">Tu experiencia también cuenta</p>
              <p className="mt-1 text-[13px] leading-relaxed text-stone-600 dark:text-stone-400">
                Sin un empleo formal se puede construir un CV sólido. En el paso <strong>Proyectos y voluntariado</strong>{' '}
                te pediremos al menos un registro: un trabajo de clase, un emprendimiento, un voluntariado o un proyecto
                personal.
              </p>
            </div>
          </div>
          <ul className="grid gap-2 text-[13px] text-stone-600 dark:text-stone-400 sm:grid-cols-3">
            {[
              ['Prácticas', 'Aunque no te pagaran, cuentan como experiencia.'],
              ['Proyectos', 'Académicos o personales, con resultado y herramientas.'],
              ['Voluntariado', 'Organización, rol, fechas y logros.'],
            ].map(([title, description]) => (
              <li key={title} className="rounded-lg border border-stone-200 p-3 dark:border-white/10">
                <p className="font-semibold text-stone-800 dark:text-stone-200">{title}</p>
                <p className="mt-0.5 text-[12px] leading-relaxed">{description}</p>
              </li>
            ))}
          </ul>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onGoToStep('projects')}
            icon={<ArrowRight className="size-4" aria-hidden />}
          >
            Ir a proyectos y voluntariado
          </Button>
        </Card>
      ) : (
        <>
          {fields.length === 0 ? (
            <EmptyState
              title="Todavía no has agregado experiencia"
              description="Incluye prácticas, freelance, trabajos temporales o tu empleo actual. Puedes agregar hasta 20."
              action={
                <Button onClick={addExperience} icon={<Plus className="size-4" aria-hidden />}>
                  Agregar mi primera experiencia
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <ExperienceCard
                  key={field.id}
                  form={form}
                  index={index}
                  onRemove={() => {
                    remove(index);
                    notify('Experiencia eliminada.', 'info');
                  }}
                />
              ))}
              <Button
                variant="secondary"
                onClick={addExperience}
                disabled={fields.length >= 20}
                icon={<Plus className="size-4" aria-hidden />}
              >
                Agregar otra experiencia
              </Button>
            </div>
          )}

          {errors.experiences?.message ? <Alert tone="error">{errors.experiences.message}</Alert> : null}

          {estimated > 0 ? (
            <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-2 text-[13px] text-stone-600 dark:text-stone-300">
                <Badge tone="brand">Cálculo</Badge>
                Sumando tus fechas, tienes aproximadamente{' '}
                <strong className="text-stone-900 dark:text-white">{String(estimated).replace('.', ',')} años</strong> de
                experiencia.
              </div>
              <Button size="sm" variant="ghost" onClick={() => onGoToStep('profile')} icon={<ArrowRight className="size-4" aria-hidden />}>
                Revisar en Perfil
              </Button>
            </Card>
          ) : null}

          <Collapsible title="Cómo escribir logros (con o sin métricas)" icon={<Lightbulb className="size-4" aria-hidden />}>
            <p className="font-medium text-stone-700 dark:text-stone-200">
              Fórmula: <span className="text-brand-700 dark:text-brand-400">verbo de acción + qué hiciste + cómo + resultado</span>
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Aumenté las ventas del canal retail en 18% (de $320 a $378 millones) con un plan de surtido por tienda.</li>
              <li>Reduje el cierre contable de 12 a 5 días automatizando 3 conciliaciones en Excel y SQL.</li>
              <li>Atendí 60 clientes diarios y mantuve una satisfacción de 92% durante 8 meses.</li>
              <li>Recluté 45 perfiles técnicos en 6 meses y bajé el tiempo de contratación de 45 a 28 días.</li>
            </ul>
            <p>
              <strong className="text-stone-700 dark:text-stone-200">Si no tienes cifras:</strong> usa alcance (personas,
              sedes, clientes), volumen (solicitudes, facturas), frecuencia (diario, semanal) o un resultado verificable.
              No inventes métricas.
            </p>
            <p>
              <strong className="text-stone-700 dark:text-stone-200">Evita</strong> empezar con “Responsable de”,
              “Encargado de” o “Apoyé en”. Empieza con un verbo en pasado.
            </p>
          </Collapsible>

          <Collapsible title="¿Hubo una pausa laboral? (opcional)">
            <TextAreaField
              label="Cuéntanos qué hiciste en ese periodo"
              rows={3}
              placeholder="Estudié una maestría y cuidé a un familiar durante 2022."
              help="Si hubo 6 meses o más sin empleo, lo redactamos en positivo. No es obligatorio."
              maxLength={600}
              error={errors.careerGap?.message}
              {...form.register('careerGap')}
            />
          </Collapsible>
        </>
      )}
    </div>
  );
}

import { useRef } from 'react';
import { useFieldArray, useWatch } from 'react-hook-form';
import { GraduationCap, Lightbulb, Plus } from 'lucide-react';
import type { Education } from '@/lib/schema';
import { emptyEducation } from '@/lib/schema';
import { EDUCATION_LEVELS } from '@/lib/options';
import {
  Alert,
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

function EducationCard({
  form,
  index,
  showAverage,
  onRemove,
}: {
  form: StepProps['form'];
  index: number;
  showAverage: boolean;
  onRemove: () => void;
}) {
  const {
    register,
    setValue,
    control,
    formState: { errors },
  } = form;

  const itemErrors = errors.education?.[index];
  const current = useWatch({ control, name: p(`education.${index}.current`) }) === true;
  const institution = useWatch({ control, name: p(`education.${index}.institution`) }) as string | undefined;
  const program = useWatch({ control, name: p(`education.${index}.program`) }) as string | undefined;

  return (
    <RepeatableCard
      index={index}
      title={program?.trim() || institution?.trim() || 'Nuevo estudio'}
      subtitle={institution?.trim() || 'Completa nivel, institución y fechas'}
      onRemove={onRemove}
      removeLabel="Eliminar este estudio"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <SelectField
            label="Nivel educativo"
            required
            options={EDUCATION_LEVELS}
            hint="Elige el nivel más alto alcanzado o en curso."
            error={itemErrors?.level?.message}
            {...register(p(`education.${index}.level`))}
          />
        </div>
        <TextField
          label="Institución"
          required
          placeholder="Universidad de Antioquia"
          help="Nombre completo, sin siglas."
          maxLength={160}
          error={itemErrors?.institution?.message}
          {...register(p(`education.${index}.institution`))}
        />
        <TextField
          label="Programa o título"
          required
          placeholder="Administración de Empresas"
          maxLength={160}
          error={itemErrors?.program?.message}
          {...register(p(`education.${index}.program`))}
        />
        <TextField
          label="Campo de estudio"
          placeholder="Finanzas"
          help="Área específica, si aplica."
          maxLength={120}
          error={itemErrors?.field?.message}
          {...register(p(`education.${index}.field`))}
        />
        {showAverage ? (
          <TextField
            label="Promedio o mención"
            placeholder="4.3/5.0"
            help="Solo si es destacado. Si no, déjalo vacío."
            maxLength={40}
            error={itemErrors?.average?.message}
            {...register(p(`education.${index}.average`))}
          />
        ) : null}
        <MonthField
          label="Fecha de inicio"
          required
          error={itemErrors?.start?.message}
          {...register(p(`education.${index}.start`))}
        />
        <div className="space-y-3">
          <MonthField
            label="Fecha de fin"
            required={!current}
            disabled={current}
            help={current ? 'Estudios en curso: no pedimos fecha de fin.' : undefined}
            error={itemErrors?.end?.message}
            {...register(p(`education.${index}.end`))}
          />
          <InlineCheckbox
            label="Actualmente estudio aquí"
            checked={current}
            onChange={(event) => {
              setValue(p(`education.${index}.current`), event.target.checked, { shouldDirty: true });
              if (event.target.checked) setValue(p(`education.${index}.end`), '');
            }}
          />
        </div>
      </div>

      <TextAreaField
        label="Logros académicos"
        rows={3}
        placeholder="Tesis sobre inclusión financiera; mención de honor; promedio destacado del semestre."
        help="Tesis, menciones, materias clave o proyectos destacados."
        maxLength={800}
        error={itemErrors?.description?.message}
        {...register(p(`education.${index}.description`))}
      />
    </RepeatableCard>
  );
}

export function EducationStep({ form, notify }: StepProps) {
  const {
    control,
    setValue,
    getValues,
    clearErrors,
    formState: { errors },
  } = form;

  const noFormal = useWatch({ control, name: 'noFormalEducation' }) === true;
  const level = useWatch({ control, name: 'level' });
  const showAverage = level === 'estudiante' || level === 'primer_empleo';
  const backup = useRef<Education[]>([]);

  const { fields, append, remove } = useFieldArray({ control, name: 'education' });

  const handleToggle = (checked: boolean) => {
    if (checked) {
      backup.current = getValues('education');
      setValue('education', [], { shouldDirty: true });
      setValue('noFormalEducation', true, { shouldDirty: true });
      clearErrors('education');
    } else {
      setValue('noFormalEducation', false, { shouldDirty: true });
      setValue('education', backup.current.length ? backup.current : [], { shouldDirty: true });
    }
  };

  const addEducation = () => {
    append(emptyEducation());
    notify('Estudio agregado. Completa nivel, institución, programa y fechas.', 'success');
  };

  return (
    <div className="space-y-6">
      <CheckboxField
        label="Aún no tengo estudios formales"
        description="Si tienes cursos, bootcamps o certificaciones, regístralos en el paso de certificaciones. También puedes continuar."
        checked={noFormal}
        onChange={(event) => handleToggle(event.target.checked)}
      />

      {noFormal ? (
        <Card className="flex items-start gap-3 p-5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-500/15 text-accent-700 dark:text-accent-400">
            <Lightbulb className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-stone-900 dark:text-white">La formación no formal también cuenta</p>
            <p className="mt-1 text-[13px] leading-relaxed text-stone-600 dark:text-stone-400">
              Registra cursos, bootcamps, certificaciones y licencias en el paso de <strong>Certificaciones</strong>.
              En el CV las agruparemos como “Formación complementaria” y daremos más peso a tu experiencia, proyectos y
              habilidades.
            </p>
          </div>
        </Card>
      ) : (
        <>
          {fields.length === 0 ? (
            <EmptyState
              title="Todavía no has agregado estudios"
              description="Incluye secundaria, técnico, pregrado, posgrado o estudios en curso. Puedes agregar hasta 15."
              action={
                <Button onClick={addEducation} icon={<GraduationCap className="size-4" aria-hidden />}>
                  Agregar mi primer estudio
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <EducationCard
                  key={field.id}
                  form={form}
                  index={index}
                  showAverage={showAverage}
                  onRemove={() => {
                    remove(index);
                    notify('Estudio eliminado.', 'info');
                  }}
                />
              ))}
              <Button
                variant="secondary"
                onClick={addEducation}
                disabled={fields.length >= 15}
                icon={<Plus className="size-4" aria-hidden />}
              >
                Agregar otro estudio
              </Button>
            </div>
          )}

          {errors.education?.message ? <Alert tone="error">{errors.education.message}</Alert> : null}
        </>
      )}

      <Collapsible title="Qué incluir y en qué orden" icon={<GraduationCap className="size-4" aria-hidden />}>
        <ul className="list-disc space-y-1 pl-5">
          <li>Del nivel más alto al más bajo. Si aún estudias, indícalo con “actualmente estudio aquí”.</li>
          <li>Escribe el nombre completo de la institución y del programa, sin siglas.</li>
          <li>Si no terminaste un programa, puedes indicar el nivel alcanzado y las fechas.</li>
          <li>Los cursos cortos y certificaciones van en el paso de certificaciones, no aquí.</li>
        </ul>
      </Collapsible>
    </div>
  );
}

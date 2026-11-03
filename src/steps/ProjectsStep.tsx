import { useFieldArray, useWatch } from 'react-hook-form';
import { FolderKanban, HeartHandshake, Lightbulb, Plus } from 'lucide-react';
import { emptyProject, emptyVolunteering } from '@/lib/schema';
import { PROJECT_TYPES, VOLUNTEER_CAUSES } from '@/lib/options';
import {
  Alert,
  Badge,
  Button,
  Card,
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

function ProjectCard({
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
  const itemErrors = errors.projects?.[index];
  const current = useWatch({ control, name: p(`projects.${index}.current`) }) === true;
  const name = useWatch({ control, name: p(`projects.${index}.name`) }) as string | undefined;

  return (
    <RepeatableCard
      index={index}
      title={name?.trim() || 'Nuevo proyecto'}
      subtitle="Problema, qué hiciste y con qué"
      onRemove={onRemove}
      removeLabel="Eliminar este proyecto"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Nombre del proyecto"
          required
          placeholder="Dashboard de cartera"
          maxLength={160}
          error={itemErrors?.name?.message}
          {...register(p(`projects.${index}.name`))}
        />
        <SelectField
          label="Tipo de proyecto"
          required
          options={PROJECT_TYPES}
          error={itemErrors?.type?.message}
          {...register(p(`projects.${index}.type`))}
        />
        <TextField
          label="Tu rol"
          required
          placeholder="Desarrolladora principal"
          maxLength={120}
          error={itemErrors?.role?.message}
          {...register(p(`projects.${index}.role`))}
        />
        <TextField
          label="Herramientas"
          placeholder="Python, SQL, Power BI"
          maxLength={300}
          error={itemErrors?.tools?.message}
          {...register(p(`projects.${index}.tools`))}
        />
        <div className="sm:col-span-2">
          <TextAreaField
            label="Descripción"
            required
            rows={3}
            placeholder="Problema que resolvía, qué diseñaste y con qué herramientas. Ej.: proyecto para visualizar la cartera vencida de una pyme; diseñé el modelo de datos y el tablero."
            help="Entre 40 y 1200 caracteres."
            maxLength={1200}
            error={itemErrors?.description?.message}
            {...register(p(`projects.${index}.description`))}
          />
        </div>
        <div className="sm:col-span-2">
          <TextAreaField
            label="Logros del proyecto"
            required
            rows={3}
            placeholder="Reduje el tiempo de análisis de 3 horas a 20 minutos."
            help="Una línea por logro (1 a 4). Verbo + resultado."
            maxLength={1600}
            error={itemErrors?.achievementsText?.message}
            {...register(p(`projects.${index}.achievementsText`))}
          />
        </div>
        <MonthField
          label="Fecha de inicio"
          required
          error={itemErrors?.start?.message}
          {...register(p(`projects.${index}.start`))}
        />
        <div className="space-y-3">
          <MonthField
            label="Fecha de fin"
            required={!current}
            disabled={current}
            error={itemErrors?.end?.message}
            {...register(p(`projects.${index}.end`))}
          />
          <InlineCheckbox
            label="Proyecto en curso"
            checked={current}
            onChange={(event) => {
              setValue(p(`projects.${index}.current`), event.target.checked, { shouldDirty: true });
              if (event.target.checked) setValue(p(`projects.${index}.end`), '');
            }}
          />
        </div>
        <div className="sm:col-span-2">
          <TextField
            label="Enlace del proyecto"
            type="url"
            inputMode="url"
            placeholder="https://github.com/..."
            help="Repositorio, demo o documento."
            maxLength={400}
            error={itemErrors?.url?.message}
            {...register(p(`projects.${index}.url`))}
          />
        </div>
      </div>
    </RepeatableCard>
  );
}

function VolunteeringCard({
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
  const itemErrors = errors.volunteering?.[index];
  const current = useWatch({ control, name: p(`volunteering.${index}.current`) }) === true;
  const organization = useWatch({ control, name: p(`volunteering.${index}.organization`) }) as string | undefined;

  return (
    <RepeatableCard
      index={index}
      title={organization?.trim() || 'Nuevo voluntariado'}
      subtitle="Organización, rol y causa"
      onRemove={onRemove}
      removeLabel="Eliminar este voluntariado"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Organización"
          required
          placeholder="Fundación Sacúdete"
          maxLength={160}
          error={itemErrors?.organization?.message}
          {...register(p(`volunteering.${index}.organization`))}
        />
        <TextField
          label="Tu rol"
          required
          placeholder="Voluntaria de comunicación"
          maxLength={120}
          error={itemErrors?.role?.message}
          {...register(p(`volunteering.${index}.role`))}
        />
        <SelectField
          label="Causa"
          required
          options={VOLUNTEER_CAUSES}
          error={itemErrors?.cause?.message}
          {...register(p(`volunteering.${index}.cause`))}
        />
        <TextField
          label="Horas totales"
          inputMode="numeric"
          placeholder="80"
          help="Si no las sabes, déjalo vacío."
          maxLength={5}
          error={itemErrors?.hours?.message}
          {...register(p(`volunteering.${index}.hours`))}
        />
        <MonthField
          label="Fecha de inicio"
          required
          error={itemErrors?.start?.message}
          {...register(p(`volunteering.${index}.start`))}
        />
        <div className="space-y-3">
          <MonthField
            label="Fecha de fin"
            required={!current}
            disabled={current}
            error={itemErrors?.end?.message}
            {...register(p(`volunteering.${index}.end`))}
          />
          <InlineCheckbox
            label="Sigo participando"
            checked={current}
            onChange={(event) => {
              setValue(p(`volunteering.${index}.current`), event.target.checked, { shouldDirty: true });
              if (event.target.checked) setValue(p(`volunteering.${index}.end`), '');
            }}
          />
        </div>
        <div className="sm:col-span-2">
          <TextAreaField
            label="Logros"
            required
            rows={3}
            placeholder="Coordiné 3 jornadas y llegué a 120 familias."
            help="Una línea por logro (1 a 4)."
            maxLength={1600}
            error={itemErrors?.achievementsText?.message}
            {...register(p(`volunteering.${index}.achievementsText`))}
          />
        </div>
      </div>
    </RepeatableCard>
  );
}

export function ProjectsStep({ form, notify }: StepProps) {
  const {
    control,
    formState: { errors },
  } = form;

  const noFormal = useWatch({ control, name: 'noFormalExperience' }) === true;
  const projects = useWatch({ control, name: 'projects' }) ?? [];
  const volunteering = useWatch({ control, name: 'volunteering' }) ?? [];
  const total = projects.length + volunteering.length;

  const projectArray = useFieldArray({ control, name: 'projects' });
  const volunteerArray = useFieldArray({ control, name: 'volunteering' });

  return (
    <div className="space-y-9">
      {noFormal ? (
        <Alert tone="warning" title="Aquí está tu experiencia">
          Como marcaste que aún no tienes experiencia formal, necesitamos al menos un proyecto o voluntariado para
          construir tu CV. Cuenta prácticas académicas, trabajos de clase, emprendimientos o causas sociales.
        </Alert>
      ) : (
        <Alert tone="info">
          Esta sección es opcional. Los proyectos y el voluntariado suman cuando refuerzan las habilidades del puesto al
          que aspiras.
        </Alert>
      )}

      <div className="flex items-center gap-2 text-[12px] font-semibold text-stone-500 dark:text-stone-400">
        <Badge tone={total > 0 ? 'success' : 'neutral'}>{total} registro(s)</Badge>
        {noFormal ? <span>Mínimo 1 para continuar</span> : <span>Opcional</span>}
      </div>

      {/* Proyectos */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-[13.5px] font-semibold text-stone-800 dark:text-stone-200">
              <FolderKanban className="size-4 text-brand-700 dark:text-brand-400" aria-hidden />
              Proyectos
            </h3>
            <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
              Académicos, personales, freelance, open source o de investigación.
            </p>
          </div>
          <Badge>{projects.length}</Badge>
        </div>

        {projectArray.fields.length === 0 ? (
          <EmptyState
            title="Sin proyectos por ahora"
            description="Un trabajo de clase, un emprendimiento o un proyecto personal puede demostrar tus habilidades."
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => projectArray.append(emptyProject())}
                icon={<Plus className="size-4" aria-hidden />}
              >
                Agregar proyecto
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {projectArray.fields.map((field, index) => (
              <ProjectCard
                key={field.id}
                form={form}
                index={index}
                onRemove={() => {
                  projectArray.remove(index);
                  notify('Proyecto eliminado.', 'info');
                }}
              />
            ))}
            <Button
              variant="secondary"
              onClick={() => projectArray.append(emptyProject())}
              disabled={projectArray.fields.length >= 30}
              icon={<Plus className="size-4" aria-hidden />}
            >
              Agregar otro proyecto
            </Button>
          </div>
        )}

        {errors.projects?.message ? <Alert tone="error">{errors.projects.message}</Alert> : null}
      </section>

      {/* Voluntariado */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-[13.5px] font-semibold text-stone-800 dark:text-stone-200">
              <HeartHandshake className="size-4 text-brand-700 dark:text-brand-400" aria-hidden />
              Voluntariado
            </h3>
            <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
              Organización, rol, causa, fechas y logros.
            </p>
          </div>
          <Badge>{volunteering.length}</Badge>
        </div>

        {volunteerArray.fields.length === 0 ? (
          <EmptyState
            title="Sin voluntariado por ahora"
            description="Si participaste en una causa social, una jornada o una organización estudiantil, cuéntalo aquí."
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => volunteerArray.append(emptyVolunteering())}
                icon={<Plus className="size-4" aria-hidden />}
              >
                Agregar voluntariado
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {volunteerArray.fields.map((field, index) => (
              <VolunteeringCard
                key={field.id}
                form={form}
                index={index}
                onRemove={() => {
                  volunteerArray.remove(index);
                  notify('Voluntariado eliminado.', 'info');
                }}
              />
            ))}
            <Button
              variant="secondary"
              onClick={() => volunteerArray.append(emptyVolunteering())}
              disabled={volunteerArray.fields.length >= 30}
              icon={<Plus className="size-4" aria-hidden />}
            >
              Agregar otro voluntariado
            </Button>
          </div>
        )}

        {errors.volunteering?.message ? <Alert tone="error">{errors.volunteering.message}</Alert> : null}
      </section>

      <Collapsible title="¿Esto va en experiencia o en proyectos?" icon={<Lightbulb className="size-4" aria-hidden />}>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Si hubo un cliente, un jefe o un pago, va en <strong className="text-stone-700 dark:text-stone-200">Experiencia</strong>.
          </li>
          <li>
            Si fue un ejercicio académico o personal sin cliente, va en{' '}
            <strong className="text-stone-700 dark:text-stone-200">Proyectos</strong>.
          </li>
          <li>
            Si fue una causa social sin remuneración, va en{' '}
            <strong className="text-stone-700 dark:text-stone-200">Voluntariado</strong>.
          </li>
          <li>No dupliques el mismo trabajo en dos secciones.</li>
        </ul>
      </Collapsible>

      <Card className="p-4">
        <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-400">
          <strong className="text-stone-800 dark:text-stone-200">Consejo:</strong> describe el problema antes de la
          solución. Un reclutador entiende mejor “la cartera vencida se revisaba en 3 hojas de cálculo” que “hice un
          dashboard”.
        </p>
      </Card>
    </div>
  );
}

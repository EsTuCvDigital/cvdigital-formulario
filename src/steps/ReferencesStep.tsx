import { useFieldArray, useWatch } from 'react-hook-form';
import { Plus, ShieldCheck, Users } from 'lucide-react';
import { emptyReference } from '@/lib/schema';
import { REFERENCE_PREFERENCES, REFERENCE_RELATIONSHIPS } from '@/lib/options';
import {
  Alert,
  Button,
  CheckboxField,
  EmptyState,
  RadioCardGroup,
  RepeatableCard,
  SelectField,
  TextAreaField,
  TextField,
} from '@/components/ui';
import { p, type StepProps } from './types';

function ReferenceCard({
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
    control,
    formState: { errors },
  } = form;
  const itemErrors = errors.references?.[index];
  const name = useWatch({ control, name: p(`references.${index}.name`) }) as string | undefined;
  const company = useWatch({ control, name: p(`references.${index}.company`) }) as string | undefined;

  return (
    <RepeatableCard
      index={index}
      title={name?.trim() || 'Nueva referencia'}
      subtitle={company?.trim() || 'Datos de contacto y autorización'}
      onRemove={onRemove}
      removeLabel="Eliminar esta referencia"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Nombre de la referencia"
          required
          placeholder="Carlos Ruiz"
          maxLength={160}
          error={itemErrors?.name?.message}
          {...register(p(`references.${index}.name`))}
        />
        <TextField
          label="Cargo"
          required
          placeholder="Gerente financiero"
          maxLength={120}
          error={itemErrors?.role?.message}
          {...register(p(`references.${index}.role`))}
        />
        <TextField
          label="Empresa"
          required
          placeholder="Banco Davivienda"
          maxLength={160}
          error={itemErrors?.company?.message}
          {...register(p(`references.${index}.company`))}
        />
        <SelectField
          label="Relación"
          required
          options={REFERENCE_RELATIONSHIPS}
          error={itemErrors?.relationship?.message}
          {...register(p(`references.${index}.relationship`))}
        />
        <TextField
          label="Correo de la referencia"
          required
          type="email"
          inputMode="email"
          placeholder="carlos.ruiz@empresa.com"
          maxLength={254}
          error={itemErrors?.email?.message}
          {...register(p(`references.${index}.email`))}
        />
        <TextField
          label="Teléfono de la referencia"
          type="tel"
          inputMode="tel"
          placeholder="+57 310 000 0000"
          help="Opcional."
          maxLength={40}
          error={itemErrors?.phone?.message}
          {...register(p(`references.${index}.phone`))}
        />
      </div>

      <CheckboxField
        label="Confirmo que informé a esta persona y tengo su autorización"
        description="Compartiremos su nombre y datos de contacto con CVDigital únicamente para verificar tu experiencia."
        error={itemErrors?.consent?.message}
        {...register(p(`references.${index}.consent`))}
      />
    </RepeatableCard>
  );
}

export function ReferencesStep({ form, notify }: StepProps) {
  const {
    register,
    control,
    formState: { errors },
  } = form;

  const preference = useWatch({ control, name: 'referencePreference' });
  const interests = useWatch({ control, name: 'interests' }) ?? '';
  const include = preference === 'incluir';

  const { fields, append, remove } = useFieldArray({ control, name: 'references' });

  return (
    <div className="space-y-7">
      <RadioCardGroup
        control={control}
        name="referencePreference"
        label="¿Cómo quieres manejar tus referencias?"
        help="En muchos CV se usa “Referencias disponibles a solicitud” para no exponer datos de terceros."
        options={REFERENCE_PREFERENCES}
        columns={1}
        error={errors.referencePreference?.message}
      />

      {include ? (
        <div className="space-y-4">
          <Alert tone="info" title="Datos de terceros">
            Solo incluiremos los datos de una referencia si la persona lo autoriza. Si no tienes esa autorización, elige
            “disponibles a solicitud”.
          </Alert>

          {fields.length === 0 ? (
            <EmptyState
              title="Agrega al menos una referencia"
              description="Un jefe directo, un colega, un cliente o un profesor que pueda hablar de tu trabajo."
              action={
                <Button onClick={() => append(emptyReference())} icon={<Users className="size-4" aria-hidden />}>
                  Agregar referencia
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <ReferenceCard
                  key={field.id}
                  form={form}
                  index={index}
                  onRemove={() => {
                    remove(index);
                    notify('Referencia eliminada.', 'info');
                  }}
                />
              ))}
              <Button
                variant="secondary"
                onClick={() => append(emptyReference())}
                disabled={fields.length >= 10}
                icon={<Plus className="size-4" aria-hidden />}
              >
                Agregar otra referencia
              </Button>
            </div>
          )}
          {errors.references?.message ? <Alert tone="error">{errors.references.message}</Alert> : null}
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-xl border border-stone-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-700 dark:text-brand-400" aria-hidden />
          <p className="text-[13px] leading-relaxed text-stone-600 dark:text-stone-400">
            Perfecto. En tu CV aparecerá “Referencias disponibles a solicitud” (o la sección se omite si elegiste no
            incluir). Así protegemos los datos de terceros y tú los compartes cuando sea necesario.
          </p>
        </div>
      )}

      <div className="pt-2">
        <TextAreaField
          label="Intereses"
          rows={3}
          placeholder="Lectura, ajedrez y voluntariado ambiental."
          help="Opcional. 1 a 3 líneas, sin datos sensibles. Suma más si estás en primer empleo."
          maxLength={500}
          currentLength={interests.length}
          limit={500}
          error={errors.interests?.message}
          {...register('interests')}
        />
      </div>
    </div>
  );
}

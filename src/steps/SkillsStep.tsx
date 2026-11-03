import { useFieldArray, useWatch } from 'react-hook-form';
import { Languages, Plus, Sparkles } from 'lucide-react';
import { emptyLanguage, emptyTechnicalSkill } from '@/lib/schema';
import {
  GENERAL_SKILL_SUGGESTIONS,
  LANGUAGE_LEVELS,
  LANGUAGE_NAMES,
  SKILL_CATEGORIES,
  SOFT_SKILLS,
  TECHNICAL_SUGGESTIONS,
} from '@/lib/options';
import {
  Alert,
  Badge,
  Button,
  Card,
  CheckGroup,
  Collapsible,
  EmptyState,
  RepeatableCard,
  SegmentedLevel,
  SelectField,
  TextAreaField,
  TextField,
} from '@/components/ui';
import { p, type StepProps } from './types';

function LanguageCard({
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
  const itemErrors = errors.languages?.[index];
  const name = useWatch({ control, name: p(`languages.${index}.name`) });
  const isOther = name === 'otro';

  return (
    <RepeatableCard
      index={index}
      title={isOther ? 'Otro idioma' : String(name || 'Idioma')}
      subtitle={itemErrors ? 'Revisa los campos marcados' : undefined}
      onRemove={onRemove}
      removeLabel="Eliminar este idioma"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Idioma"
          required
          options={LANGUAGE_NAMES}
          placeholder="Selecciona un idioma"
          error={itemErrors?.name?.message}
          {...register(p(`languages.${index}.name`))}
        />
        <SelectField
          label="Nivel MCER"
          required
          options={LANGUAGE_LEVELS}
          hint="A1-A2 básico; B1-B2 intermedio; C1-C2 avanzado."
          error={itemErrors?.level?.message}
          {...register(p(`languages.${index}.level`))}
        />
        {isOther ? (
          <TextField
            label="¿Cuál idioma?"
            required
            placeholder="Mandarín"
            maxLength={60}
            error={itemErrors?.other?.message}
            {...register(p(`languages.${index}.other`))}
          />
        ) : null}
        <TextField
          label="Certificación del idioma"
          placeholder="TOEFL iBT 100"
          help="Si tienes examen, escribe el nombre y el puntaje."
          maxLength={120}
          error={itemErrors?.certification?.message}
          {...register(p(`languages.${index}.certification`))}
        />
      </div>
    </RepeatableCard>
  );
}

export function SkillsStep({ form, notify }: StepProps) {
  const {
    register,
    control,
    formState: { errors },
  } = form;

  const technical = useWatch({ control, name: 'technicalSkills' }) ?? [];
  const softOther = useWatch({ control, name: 'softSkillsOther' }) ?? '';

  const {
    fields: skillFields,
    append: appendSkill,
    remove: removeSkill,
  } = useFieldArray({ control, name: 'technicalSkills' });

  const {
    fields: languageFields,
    append: appendLanguage,
    remove: removeLanguage,
  } = useFieldArray({ control, name: 'languages' });

  const existing = new Set(technical.map((item) => item.name.trim().toLowerCase()).filter(Boolean));
  const suggestionGroups = [
    { key: 'general', title: 'Para cualquier trabajo', items: GENERAL_SKILL_SUGGESTIONS },
    { key: 'tech', title: 'Si tu rol es técnico o de oficina', items: TECHNICAL_SUGGESTIONS },
  ];

  const addSkill = (name = '') => {
    if (skillFields.length >= 80) return;
    appendSkill(emptyTechnicalSkill(name));
    if (name) notify(`“${name}” agregada. Ajusta el nivel y los años.`, 'success');
  };

  return (
    <div className="space-y-9">
      {/* Habilidades y herramientas */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-[13.5px] font-semibold text-stone-800 dark:text-stone-200">Habilidades y herramientas</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Oficios, herramientas, software o licencias. No es obligatorio; sugerido: 3 o más.
            </p>
          </div>
          <Badge tone={technical.length >= 3 ? 'success' : 'neutral'}>
            {technical.length} registrada(s)
          </Badge>
        </div>

        <div className="space-y-3">
          {suggestionGroups.map((group) => {
            const items = group.items.filter((item) => !existing.has(item.toLowerCase()));
            if (!items.length) return null;
            return (
              <div key={group.key}>
                <p className="mb-2 text-[11px] font-bold tracking-wider text-stone-400 uppercase">{group.title}</p>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => addSkill(item)}
                      className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11.5px] font-medium text-stone-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800 dark:border-white/10 dark:bg-white/[0.03] dark:text-stone-300 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/10"
                    >
                      <Plus className="size-3" aria-hidden />
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {skillFields.length === 0 ? (
          <EmptyState
            title="Aún no has agregado habilidades"
            description="Puedes continuar sin agregarlas. Si tienes un oficio, una herramienta o un conocimiento que uses, súmalo: ayuda a que tu CV pase los filtros."
            action={<Button onClick={() => addSkill()} icon={<Plus className="size-4" aria-hidden />}>Agregar habilidad</Button>}
          />
        ) : (
          <div className="space-y-3">
            {skillFields.map((field, index) => {
              const itemErrors = errors.technicalSkills?.[index];
              return (
                <RepeatableCard
                  key={field.id}
                  index={index}
                  title={technical[index]?.name?.trim() || 'Nueva habilidad'}
                  onRemove={() => {
                    removeSkill(index);
                    notify('Habilidad eliminada.', 'info');
                  }}
                  removeLabel="Eliminar esta habilidad"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <TextField
                        label="Habilidad o herramienta"
                        required
                        placeholder="Ej.: atención al cliente, Excel, cocina, manejo de caja"
                        maxLength={100}
                        error={itemErrors?.name?.message}
                        {...register(p(`technicalSkills.${index}.name`))}
                      />
                    </div>
                    <SelectField
                      label="Categoría"
                      required
                      options={SKILL_CATEGORIES}
                      error={itemErrors?.category?.message}
                      {...register(p(`technicalSkills.${index}.category`))}
                    />
                    <TextField
                      label="Años de uso"
                      inputMode="numeric"
                      placeholder="3"
                      maxLength={2}
                      error={itemErrors?.years?.message}
                      {...register(p(`technicalSkills.${index}.years`))}
                    />
                    <div className="sm:col-span-2">
                      <SegmentedLevel
                        control={control}
                        name={p(`technicalSkills.${index}.level`)}
                        label="Nivel de dominio"
                        error={itemErrors?.level?.message}
                      />
                    </div>
                  </div>
                </RepeatableCard>
              );
            })}
            <Button
              variant="secondary"
              onClick={() => addSkill()}
              disabled={skillFields.length >= 80}
              icon={<Plus className="size-4" aria-hidden />}
            >
              Agregar otra habilidad
            </Button>
          </div>
        )}

        {errors.technicalSkills?.message ? <Alert tone="error">{errors.technicalSkills.message}</Alert> : null}
      </section>

      {/* Blandas */}
      <section className="space-y-4">
        <div>
          <h3 className="text-[13.5px] font-semibold text-stone-800 dark:text-stone-200">Habilidades blandas</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Opcional. Elige hasta 8 que puedas demostrar con un ejemplo real.
          </p>
        </div>
        <CheckGroup
          control={control}
          name="softSkills"
          label="Selecciona tus habilidades"
          help="Sin mínimo. Elige hasta 8."
          options={SOFT_SKILLS}
          columns={3}
          max={8}
          error={errors.softSkills?.message}
        />
        <TextAreaField
          label="Otras habilidades blandas"
          rows={2}
          placeholder="Negociación intercultural, mediación, enseñanza…"
          help="Sepáralas con comas. Úsalas solo si no están en la lista."
          maxLength={240}
          currentLength={softOther.length}
          limit={240}
          error={errors.softSkillsOther?.message}
          {...register('softSkillsOther')}
        />
        <p className="text-[11.5px] text-stone-400 dark:text-stone-500">
          Evita “proactivo”, “dinámico” o “apasionado”: no se pueden verificar y no aportan.
        </p>
      </section>

      {/* Idiomas */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="text-[13.5px] font-semibold text-stone-800 dark:text-stone-200">Idiomas</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Incluye tu lengua materna si quieres. Usa niveles MCER (A1 a C2) o “nativo”.
            </p>
          </div>
          <Badge tone={languageFields.length >= 1 ? 'success' : 'neutral'}>
            {languageFields.length > 0 ? `${languageFields.length} idioma(s)` : 'Opcional'}
          </Badge>
        </div>

        <div className="space-y-3">
          {languageFields.map((field, index) => (
            <LanguageCard
              key={field.id}
              form={form}
              index={index}
              onRemove={() => {
                removeLanguage(index);
                notify('Idioma eliminado.', 'info');
              }}
            />
          ))}
          {languageFields.length < 15 ? (
            <Button
              variant="secondary"
              onClick={() => appendLanguage(emptyLanguage())}
              icon={<Languages className="size-4" aria-hidden />}
            >
              Agregar otro idioma
            </Button>
          ) : null}
        </div>

        {errors.languages?.message ? <Alert tone="error">{errors.languages.message}</Alert> : null}
      </section>

      <Collapsible title="Cómo elegir el nivel de una habilidad" icon={<Sparkles className="size-4" aria-hidden />}>
        <div className="overflow-hidden rounded-lg border border-stone-200 dark:border-white/10">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-stone-50 text-[10px] tracking-wider text-stone-500 uppercase dark:bg-white/[0.04] dark:text-stone-400">
              <tr>
                <th className="px-3 py-2 font-semibold">Nivel</th>
                <th className="px-3 py-2 font-semibold">Criterio observable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-white/[0.06]">
              {[
                ['1 · Básico', 'Lo conozco y puedo usarlo con instrucciones.'],
                ['2 · Elemental', 'Lo uso en tareas simples de forma autónoma.'],
                ['3 · Intermedio', 'Lo uso a diario y resuelvo problemas típicos.'],
                ['4 · Avanzado', 'Lo domino, optimizo procesos y enseño a otros.'],
                ['5 · Experto', 'Soy referente, diseño soluciones nuevas o lidero la práctica.'],
              ].map(([label, criterion]) => (
                <tr key={label}>
                  <td className="px-3 py-2 font-semibold whitespace-nowrap text-stone-700 dark:text-stone-200">{label}</td>
                  <td className="px-3 py-2 text-stone-600 dark:text-stone-400">{criterion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          <strong className="text-stone-700 dark:text-stone-200">Regla:</strong> si no puedes demostrarlo con un ejemplo
          real, baja un nivel.
        </p>
      </Collapsible>

      <Card className="p-4">
        <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-400">
          <strong className="text-stone-800 dark:text-stone-200">¿Sabías que…</strong> las habilidades y herramientas son
          palabras clave que busca un ATS. Escribe el nombre tal como aparece en las vacantes (por ejemplo, “Power BI”,
          no “PowerBi”).
        </p>
      </Card>
    </div>
  );
}

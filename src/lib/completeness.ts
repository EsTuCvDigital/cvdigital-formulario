import type { CvValues } from './schema';
import type { StepId } from './steps';

export type ProgressItem = {
  id: StepId;
  label: string;
  done: boolean;
  required: boolean;
  hint: string;
};

export function computeProgress(values: CvValues): ProgressItem[] {
  const hasExperience = values.noFormalExperience || values.experiences.length > 0;
  const hasEducation = values.noFormalEducation || values.education.length > 0;
  const skillCount = values.technicalSkills.length + values.softSkills.length + values.languages.length;
  const hasProjects = values.projects.length + values.volunteering.length > 0;
  const projectsDone = hasProjects || !values.noFormalExperience;
  const referencesDone =
    values.referencePreference === 'incluir' ? values.references.length > 0 : Boolean(values.referencePreference);
  const profileDone =
    values.headline.trim().length >= 8 &&
    Boolean(values.level) &&
    values.summary.trim().length >= 150 &&
    values.modalities.length > 0 &&
    Boolean(values.availability) &&
    Boolean(values.schedule);
  const contactDone = Boolean(
    values.fullName.trim() &&
      values.email.trim() &&
      values.phone.trim() &&
      values.city.trim() &&
      values.country.trim(),
  );

  return [
    {
      id: 'contact',
      label: 'Datos de contacto',
      done: contactDone,
      required: true,
      hint: 'Nombre, correo, teléfono, ciudad y país.',
    },
    {
      id: 'profile',
      label: 'Perfil y objetivo',
      done: profileDone,
      required: true,
      hint: 'Titular, nivel, resumen, disponibilidad y modalidad.',
    },
    {
      id: 'experience',
      label: 'Experiencia',
      done: hasExperience,
      required: true,
      hint: values.noFormalExperience
        ? 'Marcaste que aún no tienes experiencia formal.'
        : 'Agrega al menos una experiencia.',
    },
    {
      id: 'education',
      label: 'Estudios',
      done: hasEducation,
      required: true,
      hint: values.noFormalEducation
        ? 'Marcaste que aún no tienes estudios formales.'
        : 'Agrega al menos un estudio.',
    },
    {
      id: 'skills',
      label: 'Habilidades e idiomas',
      done: true,
      required: false,
      hint:
        skillCount > 0
          ? `${skillCount} registro(s). Puedes agregar más si quieres.`
          : 'Opcional. Puedes continuar sin agregar.',
    },
    {
      id: 'projects',
      label: 'Proyectos y voluntariado',
      done: projectsDone,
      required: values.noFormalExperience,
      hint: hasProjects
        ? `${values.projects.length + values.volunteering.length} registro(s).`
        : values.noFormalExperience
          ? 'Necesitas al menos uno si no tienes experiencia formal.'
          : 'Opcional si ya tienes experiencia.',
    },
    {
      id: 'references',
      label: 'Referencias e intereses',
      done: referencesDone,
      required: false,
      hint:
        values.referencePreference === 'incluir'
          ? 'Agrega al menos una referencia autorizada.'
          : 'Opcional.',
    },
    {
      id: 'review',
      label: 'Revisión y envío',
      done: values.consent && values.truthConfirmed,
      required: true,
      hint: 'Autorización y confirmación de veracidad.',
    },
  ];
}

export function progressPercent(items: ProgressItem[]): number {
  if (!items.length) return 0;
  const done = items.filter((item) => item.done).length;
  return Math.round((done / items.length) * 100);
}

export function nextIncomplete(items: ProgressItem[]): ProgressItem | undefined {
  return items.find((item) => item.required && !item.done);
}

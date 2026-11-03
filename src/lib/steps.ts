import type { CvValues } from './schema';

export type StepId =
  | 'contact'
  | 'profile'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'references'
  | 'review';

export type StepDef = {
  id: StepId;
  title: string;
  short: string;
  icon: 'user' | 'target' | 'briefcase' | 'graduation' | 'sparkles' | 'badge' | 'folder' | 'users' | 'check';
  intro: string;
};

export const STEPS: StepDef[] = [
  {
    id: 'contact',
    title: 'Tus datos de contacto',
    short: 'Contacto',
    icon: 'user',
    intro:
      'Estos datos van en el encabezado de tu CV. No pedimos foto, cédula ni información sensible.',
  },
  {
    id: 'profile',
    title: '¿Qué buscas?',
    short: 'Perfil',
    icon: 'target',
    intro:
      'Con esto alineamos tu CV al puesto, al sector y a tu momento profesional. Si no sabes cómo escribir el resumen, te damos una guía y ejemplos.',
  },
  {
    id: 'experience',
    title: 'Tu experiencia',
    short: 'Experiencia',
    icon: 'briefcase',
    intro:
      'Incluye prácticas, freelance y trabajos informales: todo suma. Si aún no tienes experiencia formal, también hay un camino.',
  },
  {
    id: 'education',
    title: 'Tus estudios',
    short: 'Estudios',
    icon: 'graduation',
    intro:
      'Cuéntanos qué estudiaste o qué estás estudiando. Si no tienes estudios formales, no pasa nada: hay otras formas de demostrar lo que sabes.',
  },
  {
    id: 'skills',
    title: 'Habilidades e idiomas',
    short: 'Habilidades',
    icon: 'sparkles',
    intro:
      'Lo que sabes hacer, con qué nivel y en qué idiomas. Sin inflar: mejor 5 reales que 15 inventadas. Puedes continuar sin agregar.',
  },
  {
    id: 'projects',
    title: 'Proyectos y voluntariado',
    short: 'Proyectos',
    icon: 'folder',
    intro:
      'Proyectos académicos, personales, freelance y voluntariado. Si no tienes experiencia formal, esta sección es tu mejor aliada.',
  },
  {
    id: 'references',
    title: 'Referencias e intereses',
    short: 'Referencias',
    icon: 'users',
    intro: 'Esta parte es opcional. Puedes usar la fórmula “referencias disponibles a solicitud”.',
  },
  {
    id: 'review',
    title: 'Revisa y envía',
    short: 'Revisión',
    icon: 'check',
    intro: 'Revisa que todo esté correcto. Si algo falta, puedes volver al paso con un clic.',
  },
];

export const STEP_FIELDS: Record<StepId, (keyof CvValues)[]> = {
  contact: ['fullName', 'email', 'phone', 'city', 'region', 'country', 'linkedin', 'portfolio', 'github'],
  profile: [
    'cvLanguage',
    'headline',
    'level',
    'years',
    'summary',
    'jobUrl',
    'jobDescription',
    'availability',
    'modalities',
    'schedule',
    'relocation',
    'travel',
  ],
  experience: ['noFormalExperience', 'experiences', 'careerGap'],
  education: ['noFormalEducation', 'education'],
  skills: ['technicalSkills', 'softSkills', 'softSkillsOther', 'languages'],
  projects: ['projects', 'volunteering'],
  references: ['referencePreference', 'references', 'interests'],
  review: ['consent', 'truthConfirmed', 'teamNotes'],
};

/** Estudiantes y primer empleo ven primero estudios, luego experiencia. */
export function orderedSteps(level: string): StepDef[] {
  const swap = level === 'estudiante' || level === 'primer_empleo';
  if (!swap) return STEPS;
  const result = [...STEPS];
  const experienceIndex = result.findIndex((step) => step.id === 'experience');
  const educationIndex = result.findIndex((step) => step.id === 'education');
  [result[experienceIndex], result[educationIndex]] = [result[educationIndex], result[experienceIndex]];
  return result;
}

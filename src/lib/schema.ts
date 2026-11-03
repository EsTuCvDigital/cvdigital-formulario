import { z } from 'zod';
import { COUNTRIES } from './countries';
import {
  AVAILABILITY,
  CERTIFICATION_SUBTYPES,
  CREDENTIAL_TYPES,
  CV_LANGUAGES,
  EDUCATION_LEVELS,
  EMPLOYMENT_TYPES,
  LANGUAGE_LEVELS,
  LANGUAGE_NAMES,
  LEVELS,
  MODALITIES,
  PROJECT_TYPES,
  PUBLICATION_SUBTYPES,
  REFERENCE_PREFERENCES,
  REFERENCE_RELATIONSHIPS,
  RELOCATION,
  SCHEDULES,
  SKILL_CATEGORIES,
  SOFT_SKILLS,
  TRAVEL,
  VOLUNTEER_CAUSES,
} from './options';
import { isEmail, isMonthInRange, isPhone, isValidMonth, lines } from './utils';

const valuesOf = (options: { value: string }[]) => options.map((option) => option.value);

const oneOf = (values: readonly string[], message: string) =>
  z.string().refine((value) => values.includes(value), { message });

const optionalText = (max: number) =>
  z.string().trim().max(max, `Máximo ${max} caracteres.`);

const requiredText = (min: number, max: number, message: string) =>
  z.string().trim().min(min, message).max(max, `Máximo ${max} caracteres.`);

const urlField = (max = 400) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres.`)
    .refine((value) => value === '' || /^https?:\/\/[^\s.]+\.[^\s]{2,}$/i.test(value), {
      message: 'Escribe una URL completa, por ejemplo https://tusitio.com',
    });

const monthField = (required: boolean) =>
  z
    .string()
    .refine((value) => (required ? isValidMonth(value) : value === '' || isValidMonth(value)), {
      message: 'Indica una fecha válida (mes y año).',
    })
    .refine((value) => value === '' || isMonthInRange(value), {
      message: 'La fecha debe estar entre 1950 y un año en el futuro.',
    });

const yearsField = (max: number, message: string) =>
  z
    .string()
    .trim()
    .refine((value) => value === '' || (/^\d{1,2}$/.test(value) && Number(value) <= max), {
      message,
    });

function achievementsRule(min: number, max: number) {
  return (value: string, ctx: z.RefinementCtx) => {
    const items = lines(value);
    if (items.length < min) {
      ctx.addIssue({
        code: 'custom',
        message: min === 1 ? 'Escribe al menos un logro, una línea por logro.' : `Escribe al menos ${min} logros.`,
      });
    }
    if (items.length > max) {
      ctx.addIssue({ code: 'custom', message: `Máximo ${max} logros. Agrupa el resto.` });
    }
    items.forEach((item, index) => {
      if (item.length < 20) {
        ctx.addIssue({
          code: 'custom',
          message: `El logro ${index + 1} debe tener al menos 20 caracteres.`,
        });
      }
      if (item.length > 300) {
        ctx.addIssue({
          code: 'custom',
          message: `El logro ${index + 1} supera los 300 caracteres.`,
        });
      }
    });
  };
}

const achievementsField = z
  .string()
  .trim()
  .max(2400, 'Máximo 2400 caracteres.')
  .superRefine(achievementsRule(1, 6));

const shortAchievementsField = z
  .string()
  .trim()
  .max(1600, 'Máximo 1600 caracteres.')
  .superRefine(achievementsRule(1, 4));

/* -------------------------------------------------------------------------- */
/*  Entradas repetibles                                                        */
/* -------------------------------------------------------------------------- */

export const experienceSchema = z
  .object({
    company: requiredText(2, 160, 'Escribe el nombre de la empresa u organización.'),
    role: requiredText(2, 160, 'Escribe tu cargo.'),
    employmentType: oneOf(valuesOf(EMPLOYMENT_TYPES), 'Indica el tipo de contrato.'),
    modality: oneOf(valuesOf(MODALITIES), 'Indica la modalidad.'),
    location: optionalText(120),
    start: monthField(true),
    end: monthField(false),
    current: z.boolean(),
    context: optionalText(800),
    achievementsText: achievementsField,
    tools: optionalText(300),
  })
  .superRefine((value, ctx) => {
    if (value.current) return;
    if (!value.end) {
      ctx.addIssue({ code: 'custom', path: ['end'], message: 'Indica la fecha de fin o marca "trabajo aquí actualmente".' });
      return;
    }
    if (isValidMonth(value.start) && value.end < value.start) {
      ctx.addIssue({ code: 'custom', path: ['end'], message: 'La fecha de fin no puede ser anterior al inicio.' });
    }
  });

export const educationSchema = z
  .object({
    level: oneOf(valuesOf(EDUCATION_LEVELS), 'Indica tu nivel educativo.'),
    institution: requiredText(2, 160, 'Escribe el nombre de la institución.'),
    program: requiredText(2, 160, 'Escribe el nombre del programa o título.'),
    field: optionalText(120),
    start: monthField(true),
    end: monthField(false),
    current: z.boolean(),
    average: optionalText(40),
    description: optionalText(800),
  })
  .superRefine((value, ctx) => {
    if (value.current) return;
    if (!value.end) {
      ctx.addIssue({ code: 'custom', path: ['end'], message: 'Indica la fecha de fin o marca "estudio aquí actualmente".' });
      return;
    }
    if (isValidMonth(value.start) && value.end < value.start) {
      ctx.addIssue({ code: 'custom', path: ['end'], message: 'La fecha de fin no puede ser anterior al inicio.' });
    }
  });

export const technicalSkillSchema = z.object({
  name: requiredText(2, 100, 'Escribe la habilidad.'),
  category: oneOf(valuesOf(SKILL_CATEGORIES), 'Indica la categoría.'),
  level: z.number().int().min(1).max(5),
  years: yearsField(50, 'Escribe un número entre 0 y 50.'),
});

export const languageSchema = z
  .object({
    name: oneOf([...valuesOf(LANGUAGE_NAMES), 'otro'], 'Indica el idioma.'),
    other: optionalText(60),
    level: oneOf(valuesOf(LANGUAGE_LEVELS), 'Indica tu nivel de idioma.'),
    certification: optionalText(120),
  })
  .superRefine((value, ctx) => {
    if (value.name === 'otro' && !value.other.trim()) {
      ctx.addIssue({ code: 'custom', path: ['other'], message: 'Escribe cuál es el idioma.' });
    }
  });

export const credentialSchema = z
  .object({
    kind: oneOf(valuesOf(CREDENTIAL_TYPES), 'Indica el tipo de registro.'),
    subtype: optionalText(80),
    title: requiredText(2, 250, 'Escribe el nombre o título.'),
    issuer: requiredText(2, 200, 'Escribe la entidad, medio o institución.'),
    date: monthField(true),
    expires: monthField(false),
    hours: yearsField(10000, 'Escribe un número de horas válido.'),
    url: urlField(400),
    doi: optionalText(120),
    authors: optionalText(600),
    description: optionalText(800),
  })
  .superRefine((value, ctx) => {
    if (value.kind === 'certification' && !value.subtype) {
      ctx.addIssue({ code: 'custom', path: ['subtype'], message: 'Indica el tipo de certificación o curso.' });
    }
    if (value.kind === 'publication' && !value.subtype) {
      ctx.addIssue({ code: 'custom', path: ['subtype'], message: 'Indica el tipo de publicación.' });
    }
    if (value.kind === 'publication' && !value.authors.trim()) {
      ctx.addIssue({ code: 'custom', path: ['authors'], message: 'Escribe los autores en orden.' });
    }
    if (value.doi && !/^10\.\d{4,9}\/\S+$/.test(value.doi)) {
      ctx.addIssue({ code: 'custom', path: ['doi'], message: 'Escribe un DOI válido, por ejemplo 10.1234/abcde.' });
    }
    if (value.expires && value.date && value.expires < value.date) {
      ctx.addIssue({ code: 'custom', path: ['expires'], message: 'El vencimiento no puede ser anterior a la expedición.' });
    }
  });

export const projectSchema = z
  .object({
    name: requiredText(2, 160, 'Escribe el nombre del proyecto.'),
    type: oneOf(valuesOf(PROJECT_TYPES), 'Indica el tipo de proyecto.'),
    role: requiredText(2, 120, 'Escribe tu rol.'),
    description: requiredText(40, 1200, 'Escribe entre 40 y 1200 caracteres: problema, qué hiciste y con qué.'),
    achievementsText: shortAchievementsField,
    tools: optionalText(300),
    url: urlField(400),
    start: monthField(true),
    end: monthField(false),
    current: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.current) return;
    if (!value.end) {
      ctx.addIssue({ code: 'custom', path: ['end'], message: 'Indica la fecha de fin o marca "proyecto en curso".' });
      return;
    }
    if (isValidMonth(value.start) && value.end < value.start) {
      ctx.addIssue({ code: 'custom', path: ['end'], message: 'La fecha de fin no puede ser anterior al inicio.' });
    }
  });

export const volunteeringSchema = z
  .object({
    organization: requiredText(2, 160, 'Escribe la organización.'),
    role: requiredText(2, 120, 'Escribe tu rol.'),
    cause: oneOf(valuesOf(VOLUNTEER_CAUSES), 'Indica la causa.'),
    start: monthField(true),
    end: monthField(false),
    current: z.boolean(),
    achievementsText: shortAchievementsField,
    hours: yearsField(20000, 'Escribe un número de horas válido.'),
  })
  .superRefine((value, ctx) => {
    if (value.current) return;
    if (!value.end) {
      ctx.addIssue({ code: 'custom', path: ['end'], message: 'Indica la fecha de fin o marca "sigo participando".' });
      return;
    }
    if (isValidMonth(value.start) && value.end < value.start) {
      ctx.addIssue({ code: 'custom', path: ['end'], message: 'La fecha de fin no puede ser anterior al inicio.' });
    }
  });

export const referenceSchema = z
  .object({
    name: requiredText(2, 160, 'Escribe el nombre de la referencia.'),
    role: requiredText(2, 120, 'Escribe el cargo.'),
    company: requiredText(2, 160, 'Escribe la empresa.'),
    relationship: oneOf(valuesOf(REFERENCE_RELATIONSHIPS), 'Indica la relación.'),
    email: z
      .string()
      .trim()
      .refine((value) => isEmail(value), { message: 'Escribe un correo válido.' }),
    phone: z
      .string()
      .trim()
      .max(40, 'Máximo 40 caracteres.')
      .refine((value) => value === '' || isPhone(value), { message: 'Escribe un teléfono de 7 a 15 dígitos.' }),
    consent: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (!value.consent) {
      ctx.addIssue({
        code: 'custom',
        path: ['consent'],
        message: 'Necesitamos la autorización de esta persona para compartir sus datos.',
      });
    }
  });

/* -------------------------------------------------------------------------- */
/*  Formulario completo                                                       */
/* -------------------------------------------------------------------------- */

export const cvSchema = z
  .object({
    honeypot: z.string().max(200),

    /* Contacto */
    fullName: requiredText(2, 120, 'Escribe tu nombre completo (mínimo 2 caracteres).'),
    email: z
      .string()
      .trim()
      .max(254, 'Máximo 254 caracteres.')
      .refine((value) => isEmail(value), { message: 'Escribe un correo válido, por ejemplo ana.gomez@gmail.com' }),
    phone: z
      .string()
      .trim()
      .max(40, 'Máximo 40 caracteres.')
      .refine((value) => isPhone(value), { message: 'Escribe un teléfono de 7 a 15 dígitos. Ejemplo: +57 300 123 4567' }),
    city: requiredText(2, 80, 'Escribe tu ciudad.'),
    region: optionalText(80),
    country: z.string().trim().min(1, 'Selecciona tu país.').max(80),
    linkedin: urlField(400),
    portfolio: urlField(400),
    github: urlField(400),

    /* Perfil */
    cvLanguage: oneOf(valuesOf(CV_LANGUAGES), 'Elige el idioma de tu CV.'),
    headline: requiredText(8, 160, 'Escribe un titular de 8 a 160 caracteres con tu cargo y especialidad.'),
    level: oneOf(valuesOf(LEVELS), 'Elige el momento profesional en el que estás.'),
    years: yearsField(60, 'Escribe un número entre 0 y 60.'),
    summary: requiredText(150, 2000, 'Escribe entre 150 y 2000 caracteres (4 a 6 líneas).'),
    jobUrl: urlField(400),
    jobDescription: optionalText(3000),

    /* Disponibilidad */
    availability: oneOf(valuesOf(AVAILABILITY), 'Indica tu disponibilidad.'),
    modalities: z.array(z.string()).min(1, 'Elige al menos una modalidad de trabajo.'),
    schedule: oneOf(valuesOf(SCHEDULES), 'Indica el tipo de jornada.'),
    relocation: oneOf([...valuesOf(RELOCATION), ''], 'Indica si te reubicarías.'),
    travel: oneOf([...valuesOf(TRAVEL), ''], 'Indica si puedes viajar.'),

    /* Experiencia */
    noFormalExperience: z.boolean(),
    experiences: z.array(experienceSchema).max(20, 'Máximo 20 experiencias.'),
    careerGap: optionalText(600),

    /* Educación */
    noFormalEducation: z.boolean(),
    education: z.array(educationSchema).max(15, 'Máximo 15 estudios.'),

    /* Habilidades e idiomas (opcionales: sin mínimos) */
    technicalSkills: z.array(technicalSkillSchema).max(80, 'Máximo 80 habilidades y herramientas.'),
    softSkills: z.array(z.string()).max(8, 'Elige máximo 8 habilidades blandas.'),
    softSkillsOther: optionalText(240),
    languages: z.array(languageSchema).max(15, 'Máximo 15 idiomas.'),

    /* Credenciales: campo conservado para datos antiguos.
       El paso se retiró del formulario por decisión de producto. */
    credentials: z.array(credentialSchema).max(60, 'Máximo 60 registros.'),

    /* Proyectos y voluntariado */
    projects: z.array(projectSchema).max(30, 'Máximo 30 proyectos.'),
    volunteering: z.array(volunteeringSchema).max(30, 'Máximo 30 voluntariados.'),

    /* Referencias */
    referencePreference: oneOf(valuesOf(REFERENCE_PREFERENCES), 'Elige cómo manejar tus referencias.'),
    references: z.array(referenceSchema).max(10, 'Máximo 10 referencias.'),
    interests: optionalText(500),

    /* Cierre */
    consent: z.boolean(),
    marketingOptIn: z.boolean(),
    truthConfirmed: z.boolean(),
    teamNotes: optionalText(1200),
  })
  .superRefine((value, ctx) => {
    if (!value.consent) {
      ctx.addIssue({
        code: 'custom',
        path: ['consent'],
        message: 'Necesitamos tu autorización para tratar los datos.',
      });
    }
    if (!value.truthConfirmed) {
      ctx.addIssue({
        code: 'custom',
        path: ['truthConfirmed'],
        message: 'Confirma que la información es veraz antes de enviar.',
      });
    }

    if (!value.noFormalExperience && value.experiences.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['experiences'],
        message: 'Agrega al menos una experiencia o marca "aún no tengo experiencia laboral formal".',
      });
    }

    if (!value.noFormalEducation && value.education.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['education'],
        message: 'Agrega al menos un estudio o marca "aún no tengo estudios formales".',
      });
    }

    if (value.noFormalExperience && value.projects.length + value.volunteering.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['projects'],
        message: 'Si aún no tienes experiencia formal, agrega al menos un proyecto o voluntariado.',
      });
    }

    if (value.referencePreference === 'incluir' && value.references.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['references'],
        message: 'Agrega al menos una referencia o elige "disponibles a solicitud".',
      });
    }
  });

export type CvValues = z.infer<typeof cvSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type Education = z.infer<typeof educationSchema>;
export type TechnicalSkill = z.infer<typeof technicalSkillSchema>;
export type Language = z.infer<typeof languageSchema>;
export type Credential = z.infer<typeof credentialSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Volunteering = z.infer<typeof volunteeringSchema>;
export type Reference = z.infer<typeof referenceSchema>;

export const COUNTRY_OPTIONS = COUNTRIES;
export const SOFT_SKILL_VALUES = SOFT_SKILLS.map((option) => option.value);

export function emptyExperience(): Experience {
  return {
    company: '',
    role: '',
    employmentType: '',
    modality: '',
    location: '',
    start: '',
    end: '',
    current: false,
    context: '',
    achievementsText: '',
    tools: '',
  };
}

export function emptyEducation(): Education {
  return {
    level: '',
    institution: '',
    program: '',
    field: '',
    start: '',
    end: '',
    current: false,
    average: '',
    description: '',
  };
}

export function emptyTechnicalSkill(name = ''): TechnicalSkill {
  return { name, category: 'herramienta', level: 3, years: '' };
}

export function emptyLanguage(): Language {
  return { name: 'Inglés', other: '', level: 'B1', certification: '' };
}

export function emptyCredential(kind: 'certification' | 'publication' | 'award' = 'certification'): Credential {
  return {
    kind,
    subtype: kind === 'certification' ? 'certificacion' : kind === 'publication' ? 'articulo' : '',
    title: '',
    issuer: '',
    date: '',
    expires: '',
    hours: '',
    url: '',
    doi: '',
    authors: '',
    description: '',
  };
}

export function emptyProject(): Project {
  return {
    name: '',
    type: 'academico',
    role: '',
    description: '',
    achievementsText: '',
    tools: '',
    url: '',
    start: '',
    end: '',
    current: false,
  };
}

export function emptyVolunteering(): Volunteering {
  return {
    organization: '',
    role: '',
    cause: 'educacion',
    start: '',
    end: '',
    current: false,
    achievementsText: '',
    hours: '',
  };
}

export function emptyReference(): Reference {
  return {
    name: '',
    role: '',
    company: '',
    relationship: 'jefe',
    email: '',
    phone: '',
    consent: false,
  };
}

export function createEmptyValues(): CvValues {
  return {
    honeypot: '',
    fullName: '',
    email: '',
    phone: '',
    city: '',
    region: '',
    country: 'Colombia',
    linkedin: '',
    portfolio: '',
    github: '',

    cvLanguage: 'es',
    headline: '',
    level: '',
    years: '0',
    summary: '',
    jobUrl: '',
    jobDescription: '',

    availability: '',
    modalities: [],
    schedule: '',
    relocation: '',
    travel: '',

    noFormalExperience: false,
    experiences: [],
    careerGap: '',

    noFormalEducation: false,
    education: [],

    technicalSkills: [],
    softSkills: [],
    softSkillsOther: '',
    languages: [{ name: 'Español', other: '', level: 'nativo', certification: '' }],

    credentials: [],

    projects: [],
    volunteering: [],

    referencePreference: 'solicitud',
    references: [],
    interests: '',

    consent: false,
    marketingOptIn: false,
    truthConfirmed: false,
    teamNotes: '',
  };
}

export const CREDENTIAL_SUBTYPES_BY_KIND = {
  certification: CERTIFICATION_SUBTYPES,
  publication: PUBLICATION_SUBTYPES,
  award: [],
} as const;

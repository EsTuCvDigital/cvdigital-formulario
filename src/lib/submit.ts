import { CONSENT_TEXT, CONSENT_VERSION } from './constants';
import type { CvValues } from './schema';
import { supabase } from './supabase';
import { normalizeUrl, splitList, lines } from './utils';

export type SubmitSuccess = { ok: true; publicId: string; silent?: boolean };
export type SubmitFailure = { ok: false; code: string; message: string; setupHint?: boolean };
export type SubmitResult = SubmitSuccess | SubmitFailure;

const MESSAGES: Record<string, string> = {
  EMAIL_INVALIDO: 'El correo no es válido. Revísalo y vuelve a intentar.',
  SIN_CONSENTIMIENTO: 'Falta aceptar la autorización de tratamiento de datos.',
  DATOS_INCOMPLETOS: 'Faltan datos obligatorios. Revisa los pasos anteriores.',
  RATE_LIMITED:
    'Ya recibimos varios envíos con este correo hoy. Escríbenos por el canal de contacto de CVDigital para ayudarte a terminar tu CV.',
  TOO_SOON: 'Acabamos de recibir tu información. Espera un minuto antes de volver a enviar.',
  FECHA_INVALIDA: 'Hay una fecha con formato inválido. Revisa experiencia, estudios y proyectos.',
  URL_INVALIDA: 'Uno de los enlaces no es válido. Debe empezar por https://',
  PAYLOAD_GRANDE: 'La información supera el tamaño máximo permitido.',
  FORMATO_INVALIDO: 'No pudimos leer la información. Recarga la página e intenta de nuevo.',
  NETWORK: 'No pudimos conectar. Revisa tu internet e intenta de nuevo.',
  MIGRATION_MISSING:
    'La base de datos todavía no tiene el formulario instalado. Ejecuta supabase/migrations/0001_formulario_cv.sql en el SQL Editor de Supabase.',
  UNKNOWN: 'No pudimos guardar tu información. Intenta de nuevo en un momento.',
};

function buildPayload(values: CvValues) {
  return {
    honeypot: values.honeypot,
    email: values.email,
    cvLanguage: values.cvLanguage,
    consent: values.consent,
    consentVersion: CONSENT_VERSION,
    consentText: CONSENT_TEXT,
    marketingOptIn: values.marketingOptIn,
    truthConfirmed: values.truthConfirmed,

    fullName: values.fullName,
    phone: values.phone,
    city: values.city,
    region: values.region,
    country: values.country,
    linkedin: normalizeUrl(values.linkedin),
    portfolio: normalizeUrl(values.portfolio),
    github: normalizeUrl(values.github),

    headline: values.headline,
    level: values.level,
    years: values.years === '' ? 0 : Number(values.years),
    summary: values.summary,
    jobUrl: normalizeUrl(values.jobUrl),
    jobDescription: values.jobDescription,

    availability: values.availability,
    modalities: values.modalities,
    schedule: values.schedule,
    relocation: values.relocation,
    travel: values.travel,

    noFormalExperience: values.noFormalExperience,
    experiences: values.experiences.map((item) => ({
      company: item.company,
      role: item.role,
      employmentType: item.employmentType,
      modality: item.modality,
      location: item.location,
      start: item.start,
      end: item.current ? null : item.end,
      current: item.current,
      context: item.context,
      achievements: lines(item.achievementsText),
      tools: item.tools,
    })),
    careerGap: values.careerGap,

    noFormalEducation: values.noFormalEducation,
    education: values.education.map((item) => ({
      level: item.level,
      institution: item.institution,
      program: item.program,
      field: item.field,
      start: item.start,
      end: item.current ? null : item.end,
      current: item.current,
      average: item.average,
      description: item.description,
    })),

    technicalSkills: values.technicalSkills.map((item) => ({
      name: item.name,
      category: item.category,
      level: item.level,
      years: item.years === '' ? null : Number(item.years),
    })),
    softSkills: [...values.softSkills, ...splitList(values.softSkillsOther)],
    softSkillsOther: values.softSkillsOther,
    languages: values.languages.map((item) => ({
      name: item.name === 'otro' ? item.other.trim() : item.name,
      level: item.level,
      certification: item.certification,
    })),

    credentials: values.credentials.map((item) => ({
      kind: item.kind,
      subtype: item.subtype,
      title: item.title,
      issuer: item.issuer,
      date: item.date,
      expires: item.expires,
      hours: item.hours === '' ? null : Number(item.hours),
      url: normalizeUrl(item.url),
      doi: item.doi,
      authors: item.authors,
      description: item.description,
    })),

    projects: values.projects.map((item) => ({
      name: item.name,
      type: item.type,
      role: item.role,
      description: item.description,
      achievements: lines(item.achievementsText),
      tools: item.tools,
      url: normalizeUrl(item.url),
      start: item.start,
      end: item.current ? null : item.end,
      current: item.current,
    })),

    volunteering: values.volunteering.map((item) => ({
      organization: item.organization,
      role: item.role,
      cause: item.cause,
      start: item.start,
      end: item.current ? null : item.end,
      current: item.current,
      achievements: lines(item.achievementsText),
      hours: item.hours === '' ? null : Number(item.hours),
    })),

    referencePreference: values.referencePreference,
    references: values.references.map((item) => ({
      name: item.name,
      role: item.role,
      company: item.company,
      relationship: item.relationship,
      email: item.email,
      phone: item.phone,
      consent: item.consent,
    })),
    interests: values.interests,
    teamNotes: values.teamNotes,
  };
}

export function buildPayloadForExport(values: CvValues) {
  return buildPayload(values);
}

export async function submitCv(values: CvValues): Promise<SubmitResult> {
  if (!supabase) {
    return {
      ok: false,
      code: 'MIGRATION_MISSING',
      message:
        'Falta configurar la conexión con Supabase. Revisa el archivo .env.local (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY).',
      setupHint: true,
    };
  }

  try {
    const { data, error } = await supabase.rpc('submit_cv', { payload: buildPayload(values) });

    if (error) {
      const raw = `${error.message ?? ''} ${error.details ?? ''} ${error.hint ?? ''}`;
      if (
        error.code === 'PGRST202' ||
        error.code === '42883' ||
        /could not find the function|schema cache|does not exist/i.test(raw)
      ) {
        return { ok: false, code: 'MIGRATION_MISSING', message: MESSAGES.MIGRATION_MISSING, setupHint: true };
      }
      if (/FECHA_INVALIDA/i.test(raw) || error.code === '22007') {
        return { ok: false, code: 'FECHA_INVALIDA', message: MESSAGES.FECHA_INVALIDA };
      }
      if (/URL_INVALIDA/i.test(raw) || error.code === '22023') {
        return { ok: false, code: 'URL_INVALIDA', message: MESSAGES.URL_INVALIDA };
      }
      console.error('[submit_cv]', error);
      return { ok: false, code: 'UNKNOWN', message: MESSAGES.UNKNOWN };
    }

    const result = (data ?? {}) as { ok?: boolean; code?: string; publicId?: string; silent?: boolean };

    if (result.ok === true && result.publicId) {
      return { ok: true, publicId: result.publicId, silent: result.silent };
    }

    if (result.ok === false) {
      const code = result.code ?? 'UNKNOWN';
      return { ok: false, code, message: MESSAGES[code] ?? MESSAGES.UNKNOWN };
    }

    console.error('[submit_cv] respuesta inesperada', data);
    return { ok: false, code: 'UNKNOWN', message: MESSAGES.UNKNOWN };
  } catch (error) {
    console.error('[submit_cv] excepción', error);
    return { ok: false, code: 'NETWORK', message: MESSAGES.NETWORK };
  }
}

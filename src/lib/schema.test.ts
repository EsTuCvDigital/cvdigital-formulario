import { describe, expect, it } from 'vitest';
import { createEmptyValues, cvSchema, type CvValues } from './schema';

function validValues(): CvValues {
  const values = createEmptyValues();
  values.fullName = 'Ana María Gómez Ríos';
  values.email = 'ana.gomez@correo.com';
  values.phone = '+57 300 123 4567';
  values.city = 'Medellín';
  values.region = 'Antioquia';
  values.country = 'Colombia';
  values.linkedin = 'https://linkedin.com/in/ana-gomez';
  values.headline = 'Analista de datos con enfoque en salud';
  values.level = 'junior';
  values.years = '3';
  values.summary =
    'Analista de datos con 3 años de experiencia en el sector salud. Reduje el tiempo de reporte mensual de 5 días a 6 horas automatizando procesos en SQL y Power BI. Me caracterizo por el pensamiento analítico y la comunicación clara.';
  values.availability = 'inmediata';
  values.modalities = ['hibrido'];
  values.schedule = 'completo';
  values.experiences = [
    {
      company: 'Clínica del Norte',
      role: 'Analista de datos',
      employmentType: 'completo',
      modality: 'hibrido',
      location: 'Medellín',
      start: '2022-03',
      end: '',
      current: true,
      context: '',
      achievementsText: 'Reduje el tiempo de reporte mensual de 5 días a 6 horas con SQL y Power BI.',
      tools: 'SQL, Power BI',
    },
  ];
  values.education = [
    {
      level: 'pregrado',
      institution: 'Universidad de Antioquia',
      program: 'Ingeniería de Sistemas',
      field: 'Ciencia de datos',
      start: '2016-01',
      end: '2021-11',
      current: false,
      average: '',
      description: '',
    },
  ];
  values.technicalSkills = ['SQL', 'Power BI', 'Excel'].map((name) => ({
    name,
    category: 'herramienta',
    level: 3,
    years: '2',
  }));
  values.softSkills = ['Comunicación', 'Trabajo en equipo', 'Organización'];
  values.consent = true;
  values.truthConfirmed = true;
  return values;
}

function parse(values: CvValues) {
  return cvSchema.safeParse(values);
}

describe('cvSchema', () => {
  it('acepta un formulario completo válido', () => {
    const result = parse(validValues());
    expect(result.success).toBe(true);
  });

  it('rechaza un correo inválido', () => {
    const values = validValues();
    values.email = 'ana@correo';
    expect(parse(values).success).toBe(false);
  });

  it('exige consentimiento y confirmación de veracidad', () => {
    const values = validValues();
    values.consent = false;
    values.truthConfirmed = false;
    const result = parse(values);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join('.'));
      expect(paths).toContain('consent');
      expect(paths).toContain('truthConfirmed');
    }
  });

  it('rechaza un teléfono demasiado corto', () => {
    const values = validValues();
    values.phone = '123';
    expect(parse(values).success).toBe(false);
  });

  it('rechaza un enlace sin protocolo válido', () => {
    const values = validValues();
    values.portfolio = 'behance.net/ana';
    expect(parse(values).success).toBe(false);
  });

  it('exige un resumen de al menos 150 caracteres', () => {
    const values = validValues();
    values.summary = 'Analista de datos.';
    expect(parse(values).success).toBe(false);
  });

  it('permite continuar sin habilidades ni idiomas (ahora son opcionales)', () => {
    const values = validValues();
    values.technicalSkills = [];
    values.softSkills = [];
    values.languages = [];
    expect(parse(values).success).toBe(true);
  });

  it('exige una experiencia si no se marca "sin experiencia formal"', () => {
    const values = validValues();
    values.experiences = [];
    const result = parse(values);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.join('.') === 'experiences')).toBe(true);
    }
  });

  it('permite la ruta de primer empleo con un proyecto y sin experiencia', () => {
    const values = validValues();
    values.level = 'primer_empleo';
    values.noFormalExperience = true;
    values.experiences = [];
    values.projects = [
      {
        name: 'Dashboard de cartera',
        type: 'academico',
        role: 'Analista',
        description:
          'Proyecto académico para visualizar la cartera vencida de una pyme; diseñé el modelo de datos y el tablero.',
        achievementsText: 'Reduje el tiempo de análisis de 3 horas a 20 minutos.',
        tools: 'Power BI',
        url: '',
        start: '2023-02',
        end: '2023-06',
        current: false,
      },
    ];
    expect(parse(values).success).toBe(true);
  });

  it('no permite la ruta de primer empleo sin proyectos ni voluntariado', () => {
    const values = validValues();
    values.noFormalExperience = true;
    values.experiences = [];
    values.projects = [];
    values.volunteering = [];
    const result = parse(values);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.join('.') === 'projects')).toBe(true);
    }
  });

  it('rechaza una fecha de fin anterior al inicio', () => {
    const values = validValues();
    values.experiences[0].current = false;
    values.experiences[0].start = '2023-05';
    values.experiences[0].end = '2022-01';
    expect(parse(values).success).toBe(false);
  });

  it('exige la autorización del tercero al incluir referencias', () => {
    const values = validValues();
    values.referencePreference = 'incluir';
    values.references = [
      {
        name: 'Carlos Ruiz',
        role: 'Gerente',
        company: 'Banco',
        relationship: 'jefe',
        email: 'carlos@empresa.com',
        phone: '',
        consent: false,
      },
    ];
    expect(parse(values).success).toBe(false);
  });

  it('acepta la ruta sin estudios formales', () => {
    const values = validValues();
    values.noFormalEducation = true;
    values.education = [];
    expect(parse(values).success).toBe(true);
  });
});

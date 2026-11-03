export type Option<T extends string = string> = {
  value: T;
  label: string;
  description?: string;
};

export const LEVELS: Option[] = [
  {
    value: 'estudiante',
    label: 'Estudiante',
    description: 'Estoy estudiando y busco prácticas o mi primer empleo.',
  },
  {
    value: 'primer_empleo',
    label: 'Busco mi primer empleo',
    description: 'Ya terminé o estoy por terminar; aún no tengo experiencia formal.',
  },
  {
    value: 'junior',
    label: 'Junior · 1 a 3 años',
    description: 'Tengo experiencia inicial y quiero crecer en mi área.',
  },
  {
    value: 'intermedio',
    label: 'Intermedio · 4 a 7 años',
    description: 'Tengo trayectoria y resultados demostrables.',
  },
  {
    value: 'senior',
    label: 'Senior · 8 a 15 años',
    description: 'Lidero equipos, proyectos o procesos de alto impacto.',
  },
  {
    value: 'ejecutivo',
    label: 'Ejecutivo · 15 años o más',
    description: 'Dirijo áreas, unidades de negocio o compañías.',
  },
  {
    value: 'cambio_carrera',
    label: 'Cambio de carrera',
    description: 'Quiero moverme a un sector o rol distinto.',
  },
];

export const CV_LANGUAGES: Option[] = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'Inglés' },
  { value: 'both', label: 'Español e inglés (dos versiones)' },
];

export const AVAILABILITY: Option[] = [
  { value: 'inmediata', label: 'Inmediata' },
  { value: '15d', label: 'En 15 días' },
  { value: '30d', label: 'En 30 días' },
  { value: '60d', label: 'En 60 días' },
  { value: 'convenir', label: 'A convenir' },
];

export const SCHEDULES: Option[] = [
  { value: 'completo', label: 'Tiempo completo' },
  { value: 'medio', label: 'Medio tiempo' },
  { value: 'horas', label: 'Por horas' },
  { value: 'freelance', label: 'Freelance / proyectos' },
];

export const MODALITIES: Option[] = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'hibrido', label: 'Híbrido' },
  { value: 'remoto', label: 'Remoto' },
];

export const RELOCATION: Option[] = [
  { value: 'si', label: 'Sí' },
  { value: 'no', label: 'No' },
  { value: 'evaluar', label: 'Lo evaluaría' },
];

export const TRAVEL: Option[] = [
  { value: 'si', label: 'Sí' },
  { value: 'no', label: 'No' },
  { value: 'ocasional', label: 'Ocasionalmente' },
];

export const EMPLOYMENT_TYPES: Option[] = [
  { value: 'completo', label: 'Tiempo completo' },
  { value: 'medio', label: 'Medio tiempo' },
  { value: 'temporal', label: 'Temporal' },
  { value: 'practicas', label: 'Prácticas o pasantía' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'obra', label: 'Obra o labor' },
  { value: 'independiente', label: 'Independiente' },
  { value: 'otro', label: 'Otro' },
];

export const EDUCATION_LEVELS: Option[] = [
  { value: 'primaria', label: 'Primaria' },
  { value: 'secundaria', label: 'Secundaria / bachillerato' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'tecnologo', label: 'Tecnólogo' },
  { value: 'pregrado', label: 'Pregrado / universitario' },
  { value: 'especializacion', label: 'Especialización' },
  { value: 'maestria', label: 'Maestría' },
  { value: 'doctorado', label: 'Doctorado' },
  { value: 'bootcamp', label: 'Bootcamp' },
  { value: 'otro', label: 'Otro' },
];

export const SKILL_CATEGORIES: Option[] = [
  { value: 'tecnica', label: 'Conocimiento u oficio' },
  { value: 'herramienta', label: 'Herramienta' },
  { value: 'software', label: 'Software' },
  { value: 'metodologia', label: 'Metodología' },
  { value: 'licencia', label: 'Licencia o permiso' },
];

export const SKILL_LEVELS = [
  { value: 1, label: 'Básico', hint: 'Con instrucciones' },
  { value: 2, label: 'Elemental', hint: 'Tareas simples' },
  { value: 3, label: 'Intermedio', hint: 'Uso diario' },
  { value: 4, label: 'Avanzado', hint: 'Optimizo y enseño' },
  { value: 5, label: 'Experto', hint: 'Soy referente' },
];

export const SOFT_SKILLS: Option[] = [
  { value: 'Comunicación', label: 'Comunicación' },
  { value: 'Trabajo en equipo', label: 'Trabajo en equipo' },
  { value: 'Liderazgo', label: 'Liderazgo' },
  { value: 'Resolución de problemas', label: 'Resolución de problemas' },
  { value: 'Pensamiento crítico', label: 'Pensamiento crítico' },
  { value: 'Adaptabilidad', label: 'Adaptabilidad' },
  { value: 'Organización', label: 'Organización' },
  { value: 'Gestión del tiempo', label: 'Gestión del tiempo' },
  { value: 'Empatía', label: 'Empatía' },
  { value: 'Negociación', label: 'Negociación' },
  { value: 'Orientación al detalle', label: 'Orientación al detalle' },
  { value: 'Aprendizaje continuo', label: 'Aprendizaje continuo' },
  { value: 'Tolerancia a la presión', label: 'Tolerancia a la presión' },
  { value: 'Creatividad', label: 'Creatividad' },
  { value: 'Servicio al cliente', label: 'Servicio al cliente' },
];

/** Oficios y herramientas para cualquier tipo de trabajo. */
export const GENERAL_SKILL_SUGGESTIONS = [
  'Atención al cliente',
  'Manejo de caja',
  'Inventario',
  'Preparación de alimentos',
  'Manipulación de alimentos',
  'Servicio en mesa',
  'Ventas',
  'Telemercadeo',
  'Logística',
  'Bodega y almacenamiento',
  'Recepción',
  'Agenda y citas',
  'Facturación',
  'Limpieza y orden',
  'Conducción',
  'Manejo de montacargas',
  'Excel',
  'Word',
  'Google Workspace',
  'Canva',
];

/** Herramientas y conocimientos para roles técnicos o de oficina. */
export const TECHNICAL_SUGGESTIONS = [
  'SQL',
  'Power BI',
  'Tableau',
  'Python',
  'JavaScript',
  'Gestión de proyectos',
  'Scrum',
  'Kanban',
  'CRM (Salesforce / HubSpot)',
  'SAP',
  'NIIF',
  'Nómina',
  'Marketing digital',
  'SEO',
  'Diseño gráfico',
  'Soporte técnico',
];

export const LANGUAGE_NAMES: Option[] = [
  { value: 'Español', label: 'Español' },
  { value: 'Inglés', label: 'Inglés' },
  { value: 'Portugués', label: 'Portugués' },
  { value: 'Francés', label: 'Francés' },
  { value: 'Alemán', label: 'Alemán' },
  { value: 'Italiano', label: 'Italiano' },
  { value: 'otro', label: 'Otro idioma' },
];

export const LANGUAGE_LEVELS: Option[] = [
  { value: 'A1', label: 'A1 · Principiante' },
  { value: 'A2', label: 'A2 · Básico' },
  { value: 'B1', label: 'B1 · Intermedio' },
  { value: 'B2', label: 'B2 · Intermedio alto' },
  { value: 'C1', label: 'C1 · Avanzado' },
  { value: 'C2', label: 'C2 · Dominio' },
  { value: 'nativo', label: 'Nativo o lengua materna' },
];

export const CREDENTIAL_TYPES: Option[] = [
  { value: 'certification', label: 'Certificación o curso' },
  { value: 'publication', label: 'Publicación' },
  { value: 'award', label: 'Premio o reconocimiento' },
];

export const CERTIFICATION_SUBTYPES: Option[] = [
  { value: 'certificacion', label: 'Certificación' },
  { value: 'curso', label: 'Curso' },
  { value: 'diplomado', label: 'Diplomado' },
  { value: 'bootcamp', label: 'Bootcamp' },
  { value: 'licencia', label: 'Licencia o tarjeta profesional' },
];

export const PUBLICATION_SUBTYPES: Option[] = [
  { value: 'articulo', label: 'Artículo' },
  { value: 'libro', label: 'Libro' },
  { value: 'capitulo', label: 'Capítulo de libro' },
  { value: 'ponencia', label: 'Ponencia' },
  { value: 'preprint', label: 'Preprint' },
  { value: 'otro', label: 'Otro' },
];

export const PROJECT_TYPES: Option[] = [
  { value: 'academico', label: 'Académico' },
  { value: 'personal', label: 'Personal' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'open_source', label: 'Open source' },
  { value: 'investigacion', label: 'Investigación' },
];

export const VOLUNTEER_CAUSES: Option[] = [
  { value: 'educacion', label: 'Educación' },
  { value: 'salud', label: 'Salud' },
  { value: 'ambiente', label: 'Medio ambiente' },
  { value: 'comunidad', label: 'Comunidad' },
  { value: 'animal', label: 'Animales' },
  { value: 'cultural', label: 'Cultura' },
  { value: 'deportivo', label: 'Deporte' },
  { value: 'otro', label: 'Otra' },
];

export const REFERENCE_PREFERENCES: Option[] = [
  {
    value: 'solicitud',
    label: 'Referencias disponibles a solicitud',
    description: 'Recomendado: no expone datos de terceros en el CV.',
  },
  {
    value: 'incluir',
    label: 'Incluir referencias en el CV',
    description: 'Necesitamos el nombre, contacto y autorización de cada persona.',
  },
  {
    value: 'no',
    label: 'No incluir referencias',
    description: 'Tu CV irá sin esta sección.',
  },
];

export const REFERENCE_RELATIONSHIPS: Option[] = [
  { value: 'jefe', label: 'Jefe directo' },
  { value: 'colega', label: 'Colega' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'profesor', label: 'Profesor' },
  { value: 'otro', label: 'Otra' },
];

export const ACTION_VERBS = [
  'lideré',
  'dirigí',
  'coordiné',
  'gestioné',
  'implementé',
  'desarrollé',
  'diseñé',
  'lancé',
  'optimicé',
  'reduje',
  'aumenté',
  'mejoré',
  'automaticé',
  'migré',
  'reestructuré',
  'estandaricé',
  'consolidé',
  'amplié',
  'negocié',
  'supervisé',
  'capacité',
  'analicé',
  'construí',
  'documenté',
  'digitalicé',
];

export function labelOf(options: Option[], value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return options.find((option) => String(option.value) === String(value))?.label ?? String(value);
}

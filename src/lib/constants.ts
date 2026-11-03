export const SERVICE_NAME = (import.meta.env.VITE_SERVICE_NAME as string | undefined) || 'CVDigital';

export const CONSENT_VERSION = '2026-01';

/**
 * Texto exacto que el usuario acepta. Se guarda junto al CV con fecha y versión
 * para poder demostrar el consentimiento.
 */
export const CONSENT_TEXT =
  'Autorizo a CVDigital a tratar y publicar mis datos profesionales para crear mi hoja de vida web y contactarme sobre este servicio, conforme a la Ley 1581 de 2012. Puedo consultar, actualizar o pedir la eliminación de mis datos por el canal de privacidad. No autorizo datos sensibles.';

/** ⚠️ Reemplaza este correo por el canal de privacidad real de CVDigital. */
export const PRIVACY_CONTACT = 'privacidad@cvdigital.co';

export const PRIVACY_RETENTION = {
  active: 'Mientras tu solicitud esté activa y hasta 12 meses después de la última interacción.',
  drafts: 'Los borradores guardados en este navegador se eliminan a los 90 días o cuando borras el borrador.',
  location: 'La información se aloja en Supabase, con acceso restringido y cifrado en tránsito.',
};

export const DRAFT_KEY = 'cvdigital.formulario.draft.v1';
export const DRAFT_VERSION = 1;
export const DRAFT_TTL_DAYS = 90;
export const THEME_KEY = 'cvdigital.tema';

export const AUTOSAVE_MS = 900;
export const TOTAL_STEPS = 8;

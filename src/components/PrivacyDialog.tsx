import { CONSENT_TEXT, PRIVACY_CONTACT, PRIVACY_RETENTION, SERVICE_NAME } from '@/lib/constants';
import { Modal } from './ui';

export function PrivacyDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Privacidad y tratamiento de datos">
      <section className="space-y-2">
        <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-100">Qué datos pedimos y para qué</h4>
        <p>
          Usamos tu información profesional (contacto, experiencia, estudios, habilidades e idiomas) para redactar,
          diseñar y publicar tu hoja de vida, y para contactarte sobre este servicio. También puedes autorizar,
          por separado, el envío de consejos y novedades.
        </p>
      </section>

      <section className="space-y-2">
        <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-100">Qué NO pedimos</h4>
        <p>
          No solicitamos foto, cédula, edad, fecha de nacimiento, estado civil, religión, afiliación política,
          información de salud, número de hijos, EPS ni datos biométricos. Tampoco pedimos datos de terceros sin su
          autorización.
        </p>
      </section>

      <section className="space-y-2">
        <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-100">Autorización</h4>
        <blockquote className="rounded-xl border border-stone-200 bg-stone-50 p-3.5 text-[13px] italic dark:border-white/10 dark:bg-white/[0.04]">
          {CONSENT_TEXT}
        </blockquote>
      </section>

      <section className="space-y-2">
        <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-100">Cuánto tiempo conservamos la información</h4>
        <ul className="list-disc space-y-1 pl-5">
          <li>{PRIVACY_RETENTION.active}</li>
          <li>{PRIVACY_RETENTION.drafts}</li>
          <li>{PRIVACY_RETENTION.location}</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-100">Tus derechos</h4>
        <p>
          Puedes solicitar acceso, rectificación, actualización, supresión y revocatoria de la autorización escribiendo
          a <span className="font-semibold text-stone-800 dark:text-stone-100">{PRIVACY_CONTACT}</span>. Si pides la
          eliminación, también despublicamos la URL de tu CV. Algunos registros pueden conservarse durante el tiempo
          exigido por obligaciones legales o en copias de seguridad.
        </p>
      </section>

      <section className="space-y-2">
        <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-100">Alcance del servicio</h4>
        <p>
          {SERVICE_NAME} prepara y mejora tu hoja de vida, pero no garantiza entrevistas ni una contratación. La
          información que envías debe ser veraz; las fechas, cargos y logros pueden ser verificados por un reclutador.
        </p>
      </section>

      <p className="border-t border-stone-200 pt-3 text-[11.5px] text-stone-400 dark:border-white/10 dark:text-stone-500">
        Versión del consentimiento: 2026-01. Este texto debe revisarse con el responsable de privacidad de {SERVICE_NAME}
        antes de publicar el formulario.
      </p>
    </Modal>
  );
}

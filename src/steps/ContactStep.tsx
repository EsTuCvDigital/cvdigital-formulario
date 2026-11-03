import { Lock } from 'lucide-react';
import { COUNTRIES } from '@/lib/countries';
import type { Option } from '@/lib/options';
import { normalizeUrl } from '@/lib/utils';
import { Card, SelectField, TextField } from '@/components/ui';
import type { StepProps } from './types';

const countryOptions: Option[] = COUNTRIES.map((country) => ({ value: country, label: country }));

export function ContactStep({ form }: StepProps) {
  const {
    register,
    setValue,
    formState: { errors },
  } = form;

  const normalizeOnBlur = (field: 'linkedin' | 'portfolio' | 'github') =>
    (event: React.FocusEvent<HTMLInputElement>) => {
      const value = event.target.value.trim();
      if (value) setValue(field, normalizeUrl(value), { shouldValidate: true });
    };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-[13px] font-bold tracking-[0.12em] text-stone-400 uppercase dark:text-stone-500">
          Identidad y contacto
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <TextField
              label="Nombre completo"
              required
              autoComplete="name"
              placeholder="Ana María Gómez Ríos"
              help="Escríbelo como quieres que aparezca en el CV. Sin cédula ni datos adicionales."
              maxLength={120}
              error={errors.fullName?.message}
              {...register('fullName')}
            />
          </div>
          <TextField
            label="Correo electrónico"
            required
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="tu.nombre@correo.com"
            help="No lo publicamos. Lo usamos para contactarte sobre tu CV."
            maxLength={254}
            error={errors.email?.message}
            {...register('email')}
          />
          <TextField
            label="Teléfono de contacto"
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+57 300 123 4567"
            help="Incluye el indicativo del país. No pedimos WhatsApp aparte."
            maxLength={40}
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-[13px] font-bold tracking-[0.12em] text-stone-400 uppercase dark:text-stone-500">
          Ubicación
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Ciudad"
            required
            autoComplete="address-level2"
            placeholder="Medellín"
            help="Ciudad donde vives o donde buscas empleo."
            maxLength={80}
            error={errors.city?.message}
            {...register('city')}
          />
          <TextField
            label="Departamento o estado"
            autoComplete="address-level1"
            placeholder="Antioquia"
            help="Ayuda a ubicar tu perfil en búsquedas regionales."
            maxLength={80}
            error={errors.region?.message}
            {...register('region')}
          />
          <div className="sm:col-span-2">
            <SelectField
              label="País de residencia"
              required
              autoComplete="country-name"
              options={countryOptions}
              placeholder="Selecciona tu país"
              error={errors.country?.message}
              {...register('country')}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-[13px] font-bold tracking-[0.12em] text-stone-400 uppercase dark:text-stone-500">
            Enlaces profesionales
          </h3>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            Opcional, pero suma. Si pegas el enlace sin <span className="font-mono">https://</span>, lo completamos por ti.
          </p>
        </div>
        <div className="grid gap-4">
          <TextField
            label="Perfil de LinkedIn"
            type="url"
            inputMode="url"
            placeholder="https://www.linkedin.com/in/ana-gomez"
            help="Copia la URL completa de tu perfil público."
            maxLength={400}
            error={errors.linkedin?.message}
            {...register('linkedin', { onBlur: normalizeOnBlur('linkedin') })}
          />
          <TextField
            label="Portafolio o sitio web"
            type="url"
            inputMode="url"
            placeholder="https://tusitio.com"
            help="Portafolio, Behance, Medium o página personal."
            maxLength={400}
            error={errors.portfolio?.message}
            {...register('portfolio', { onBlur: normalizeOnBlur('portfolio') })}
          />
          <TextField
            label="Perfil de GitHub"
            type="url"
            inputMode="url"
            placeholder="https://github.com/anagomez"
            help="Solo si tienes repositorios públicos relevantes."
            maxLength={400}
            error={errors.github?.message}
            {...register('github', { onBlur: normalizeOnBlur('github') })}
          />
        </div>
      </section>

      <Card className="flex items-start gap-3 border-brand-200/70 bg-brand-50/40 p-4 dark:border-brand-500/20 dark:bg-brand-500/[0.06]">
        <Lock aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-700 dark:text-brand-400" />
        <p className="text-xs leading-relaxed text-brand-950/80 dark:text-brand-100/80">
          <span className="font-semibold">Privacidad desde el inicio:</span> no pedimos foto, cédula, edad, estado civil,
          religión, salud ni información de familia. Solo lo necesario para escribir tu hoja de vida. Puedes leer el
          detalle en el enlace de privacidad del encabezado.
        </p>
      </Card>
    </div>
  );
}

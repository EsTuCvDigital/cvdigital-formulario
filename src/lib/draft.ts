import { DRAFT_KEY, DRAFT_TTL_DAYS, DRAFT_VERSION } from './constants';
import { createEmptyValues, type CvValues } from './schema';

export type Draft = {
  version: number;
  savedAt: number;
  stepIndex: number;
  values: CvValues;
};

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function mergeValues(raw: unknown): CvValues {
  const base = createEmptyValues();
  if (!raw || typeof raw !== 'object') return base;
  const input = raw as Record<string, unknown>;
  const merged = { ...base } as Record<string, unknown>;

  for (const key of Object.keys(base) as (keyof CvValues)[]) {
    const fallback = base[key];
    const candidate = input[key];
    if (Array.isArray(fallback)) {
      merged[key] = isArray(candidate) ? candidate : fallback;
    } else if (typeof fallback === 'string') {
      merged[key] = typeof candidate === 'string' ? candidate : fallback;
    } else if (typeof fallback === 'boolean') {
      merged[key] = typeof candidate === 'boolean' ? candidate : fallback;
    } else {
      merged[key] = candidate ?? fallback;
    }
  }

  return merged as CvValues;
}

export function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<Draft>;
    if (parsed.version !== DRAFT_VERSION || !parsed.savedAt || !parsed.values) return null;

    const age = Date.now() - Number(parsed.savedAt);
    if (!Number.isFinite(age) || age > DRAFT_TTL_DAYS * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }

    return {
      version: DRAFT_VERSION,
      savedAt: Number(parsed.savedAt),
      stepIndex: Math.max(0, Math.min(20, Number(parsed.stepIndex) || 0)),
      values: mergeValues(parsed.values),
    };
  } catch {
    return null;
  }
}

export function saveDraft(stepIndex: number, values: CvValues): boolean {
  try {
    const payload: Draft = {
      version: DRAFT_VERSION,
      savedAt: Date.now(),
      stepIndex,
      values,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* almacenamiento no disponible */
  }
}

export function hasContent(values: CvValues): boolean {
  return Boolean(
    values.fullName.trim() ||
      values.email.trim() ||
      values.headline.trim() ||
      values.summary.trim() ||
      values.experiences.length ||
      values.education.length ||
      values.technicalSkills.length ||
      values.projects.length ||
      values.volunteering.length,
  );
}

export function draftSummary(draft: Draft): string {
  const name = draft.values.fullName.trim();
  if (name) return name;
  if (draft.values.headline.trim()) return draft.values.headline.trim();
  return 'Borrador sin nombre';
}

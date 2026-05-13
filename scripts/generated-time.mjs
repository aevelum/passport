const fixedGeneratedAt = '1970-01-01T00:00:00.000Z';

export function getGeneratedAt(env = process.env) {
  if (env.PASSPORT_GENERATED_AT) return normalizeIsoTime(env.PASSPORT_GENERATED_AT, 'PASSPORT_GENERATED_AT');
  if (env.SOURCE_DATE_EPOCH) return fromSourceDateEpoch(env.SOURCE_DATE_EPOCH);
  return fixedGeneratedAt;
}

function fromSourceDateEpoch(value) {
  if (!/^\d+$/.test(value)) throw new Error('SOURCE_DATE_EPOCH must be an integer Unix timestamp in seconds');
  const millis = Number(value) * 1000;
  if (!Number.isSafeInteger(millis)) throw new Error('SOURCE_DATE_EPOCH is outside the supported JavaScript timestamp range');
  return new Date(millis).toISOString();
}

function normalizeIsoTime(value, name) {
  const millis = Date.parse(value);
  if (!Number.isFinite(millis)) throw new Error(`${name} must be an ISO-8601 timestamp`);
  return new Date(millis).toISOString();
}

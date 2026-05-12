const haircutSchedules = Object.freeze({
  'haircut-us-treasury-2pct': Object.freeze({ haircutPercentage: 0.02 })
});

const concentrationLimits = Object.freeze({
  none: Object.freeze([])
});

/**
 * @param {{ now?: string, sourceRef?: string }=} options
 */
export function createDefaultAdapterContext(options = {}) {
  return Object.freeze({
    now: options.now ?? new Date().toISOString(),
    sourceRef: options.sourceRef ?? 'interop/samples/repo-pretrade-passport-input.json',
    securityPolicy: Object.freeze({
      allowDynamicPlugins: false,
      allowEval: false,
      allowNetworkInCi: false
    }),
    resolvers: Object.freeze({
      resolveHaircutSchedule,
      resolveConcentrationLimit
    })
  });
}

function resolveHaircutSchedule(ref) {
  const schedule = haircutSchedules[ref];
  if (!schedule) throw new Error(`unknown haircut schedule ref: ${ref}`);
  return schedule;
}

function resolveConcentrationLimit(ref) {
  const limit = concentrationLimits[ref];
  if (!limit) throw new Error(`unknown concentration limit ref: ${ref}`);
  return limit;
}

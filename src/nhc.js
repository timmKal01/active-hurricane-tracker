import { log } from 'apify';

const BASE_URL = 'https://www.nhc.noaa.gov/CurrentStorms.json';
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 1000;

const BASIN_PREFIXES = {
    atlantic: 'al',
    'eastern-pacific': 'ep',
    'central-pacific': 'cp',
};

// Only TD/TS/HU form a clean intensity ordering; other real NHC codes (SD, SS subtropical,
// EX extratropical, PTC potential tropical cyclone) don't fit that scale, so a storm with an
// unrecognized classification always passes the filter rather than being silently dropped.
const CLASSIFICATION_RANK = { TD: 1, TS: 2, HU: 3 };

async function fetchWithTimeout(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
        return await fetch(url, { signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

export async function fetchActiveStorms({ basin, minimumClassification }) {
    let lastErr;
    let body = null;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            const res = await fetchWithTimeout(BASE_URL);
            const parsed = await res.json().catch(() => null);
            if (res.ok && parsed && Array.isArray(parsed.activeStorms)) {
                body = parsed;
                break;
            }
            const retryable = res.status === 429 || res.status >= 500 || parsed === null;
            lastErr = new Error(`NHC current-storms request failed: ${res.status} ${res.statusText}`);
            if (!retryable) throw lastErr;
        } catch (err) {
            lastErr = err.name === 'AbortError'
                ? new Error(`NHC current-storms request timed out (attempt ${attempt}/${MAX_ATTEMPTS})`)
                : err;
        }
        if (attempt < MAX_ATTEMPTS) {
            const delay = BASE_DELAY_MS * 2 ** (attempt - 1);
            log.warning(`Retrying NHC request in ${delay}ms (attempt ${attempt}/${MAX_ATTEMPTS}): ${lastErr.message}`);
            await new Promise((r) => setTimeout(r, delay));
        }
    }
    if (body === null) throw lastErr;

    const basinPrefix = basin && basin !== 'all' ? BASIN_PREFIXES[basin] : null;
    const minRank = minimumClassification && minimumClassification !== 'any'
        ? CLASSIFICATION_RANK[minimumClassification]
        : null;

    const results = [];
    for (const storm of body.activeStorms) {
        try {
            if (!storm || typeof storm !== 'object' || !storm.id) continue;
            if (basinPrefix && !storm.id.toLowerCase().startsWith(basinPrefix)) continue;

            const rank = CLASSIFICATION_RANK[storm.classification];
            if (minRank !== null && rank !== undefined && rank < minRank) continue;

            results.push({
                id: storm.id,
                name: storm.name ?? null,
                classification: storm.classification ?? null,
                maxSustainedWindMph: storm.intensity != null ? Number(storm.intensity) : null,
                minCentralPressureMb: storm.pressure != null ? Number(storm.pressure) : null,
                latitude: storm.latitudeNumeric ?? null,
                longitude: storm.longitudeNumeric ?? null,
                movementDirectionDegrees: storm.movementDir ?? null,
                movementSpeedMph: storm.movementSpeed ?? null,
                lastUpdate: storm.lastUpdate ?? null,
                publicAdvisoryUrl: storm.publicAdvisory?.url ?? null,
                forecastDiscussionUrl: storm.forecastDiscussion?.url ?? null,
                forecastGraphicsUrl: storm.forecastGraphics?.url ?? null,
            });
        } catch (err) {
            log.warning(`Skipping malformed storm record: ${err.message}`);
        }
    }
    return results;
}

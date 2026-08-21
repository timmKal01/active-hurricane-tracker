import { Actor, log } from 'apify';
import { fetchActiveStorms } from './nhc.js';

await Actor.init();

const input = (await Actor.getInput()) ?? {};
const { basin = 'all', minimumClassification = 'any' } = input;

/** Must match the event name configured in this Actor's pay-per-event pricing on Apify. */
const STORM_STATUS_CHECK_EVENT = 'storm-status-check';

const storms = await fetchActiveStorms({ basin, minimumClassification });

for (const storm of storms) {
    await Actor.pushData(storm);
}

await Actor.charge({ eventName: STORM_STATUS_CHECK_EVENT });

log.info(`Pushed ${storms.length} active storm(s)`);

await Actor.exit();

# Active Hurricane & Tropical Storm Tracker

Get every currently active tropical cyclone the US National Hurricane
Center is tracking in the Atlantic and Eastern/Central Pacific basins
— name, classification, max sustained wind, pressure, position,
movement, and links to the latest public advisory and forecast
discussion — via the official [NHC current-storms
feed](https://www.nhc.noaa.gov/).

Built for logistics, insurance, media, and emergency-planning teams
who need current storm status without checking nhc.noaa.gov by hand.

## Input

```json
{
  "basin": "all",
  "minimumClassification": "any"
}
```

| Field | Type | Description |
|---|---|---|
| `basin` | string | `"all"`, `"atlantic"`, `"eastern-pacific"`, or `"central-pacific"`. Default `"all"`. |
| `minimumClassification` | string | `"any"`, `"TD"` (Tropical Depression or stronger), `"TS"` (Tropical Storm or stronger), or `"HU"` (Hurricane strength only). A storm with a classification outside this TD/TS/HU scale (e.g. a subtropical or post-tropical system) is always included rather than silently dropped. Default `"any"`. |

## Output

One record per active storm, or zero rows during a quiet stretch —
that's a real "nothing currently active" result, not an error:

```json
{
  "id": "cp012026",
  "name": "Lala",
  "classification": "HU",
  "maxSustainedWindMph": 80,
  "minCentralPressureMb": 974,
  "latitude": 26.1,
  "longitude": -172,
  "movementDirectionDegrees": 15,
  "movementSpeedMph": 10,
  "lastUpdate": "2026-08-21T06:00:00.000Z",
  "publicAdvisoryUrl": "https://www.nhc.noaa.gov/text/HFOTCPCP2.shtml",
  "forecastDiscussionUrl": "https://www.nhc.noaa.gov/text/HFOTCDCP2.shtml",
  "forecastGraphicsUrl": "https://www.nhc.noaa.gov/graphics_cp2.shtml"
}
```

## How it works

A direct call to NHC's official public `CurrentStorms.json` feed — no
proxy, no key, no scraping. NHC covers the Atlantic and Eastern/Central
Pacific only; storms elsewhere (e.g. Western Pacific typhoons, Indian
Ocean cyclones) are tracked by other national agencies and aren't in
this feed.

## Pricing note

Billed per **check** (one run), regardless of how many storms are
currently active.

## Related products

- [Space Weather Alert](https://github.com/timmKal01/space-weather-alert) — solar/geomagnetic conditions, a different hazard-monitoring family
- [Disaster Declaration Tracker](https://github.com/timmKal01/disaster-declaration-tracker) — FEMA disaster declarations, often triggered after a storm like this makes landfall

# Proposal — Atomise Time and Location (Stage 6 Standard Y11, topic `t-s6st11-time`)

**Status: APPLIED 2026-07-17** — approved by the user and applied to `data/skills.json`. QUEUE.md row 51 → applied.

## Context

Queue row 51. Two booklets:

1. `Stage 6 Standard/Time and Location 1_Positions on the Earth's surface.md` → **dp-s6st11-time-1, -2**
2. `Stage 6 Standard/Time and Location 2_Time and time differences.md` → **dp-s6st11-time-3, -4**

MST-11-06.

## Finding (headline)

Topic carried 7 tagged skills (`latitude-longitude`, `longitude-time-difference`, `convert-time-units`, `convert-12-24-hour-time`, `calculate-elapsed-time`, `time-zones-daylight-saving`, `utc-problems`) — the spine was complete. One genuine structural gap: **angular differences / relative positions in latitude–longitude** (same-side subtract, opposite-side add, wrap past 90°/180°) gets two full question tiers in Booklet 1 (Dev Q5–9, Mastery Q11–14), appears in the 2017 HSC question in Booklet 2, and is the invisible middle step of `longitude-time-difference` — yet no skill carried it. Plus 2 blurb fixes and 2 tags.

## 1. New skills (1) — APPLIED

### `latitude-longitude-difference`

```json
{
  "id": "latitude-longitude-difference",
  "title": "Find differences in latitude and longitude",
  "blurb": "Find the angular difference between two points' latitudes or longitudes — subtracting on the same side of the Equator or Prime Meridian, adding on opposite sides — and find relative positions, including wrapping past $90°$ or $180°$.",
  "stage": 6,
  "courses": ["s6-std11"],
  "dotPointIds": ["dp-s6st11-time-1"],
  "prereqs": ["latitude-longitude"],
  "difficulty": 2
}
```

**Trace.** Booklet 1: Dev Q5 (relative position), Q6–7 (Brussels/Lima, Tehran/Wellington — opposite-hemisphere differences), Q8–9 (points due N/S/E/W), Mastery Q11 (wrap-around past 180°/90°), Q12–14; feeds Q10 c–f (time differences needing opposite-side longitude addition before ÷15). Booklet 2: 2017 HSC Band 5 (island 30° west of 5°E → crosses Prime Meridian → 25°W).

**Edge-bar.** (1) Distinctive — the hemisphere decision (add vs subtract) is the characteristic enabler; not ambient subtraction. (2) At-risk — Development *and* Mastery tiers plus wrap-around diagrams target exactly this error mode; HSC-examined. (3) Proximity — prereq same topic, same stage. (4) Non-redundant — `latitude-longitude` is identification only; no existing skill computes differences.

## 2. New prereq edges (1, net 0 after transitive reduction) — APPLIED

- **`longitude-time-difference` ← `latitude-longitude-difference`** — Booklet 1 Q10 c–f and 2017 HSC both require the opposite-side longitude difference *before* applying $15° = 1$ h. **Transitive reduction:** dropped `longitude-time-difference` ← `latitude-longitude` (reachable through the new skill).

## 3. Edits to existing skills (4) — APPLIED

**a. `calculate-elapsed-time` blurb re-scope** — Booklet 2 §Calculations With Time teaches end time / start time / elapsed time as one method family (sexagesimal add/subtract with ±24 wrap):

| | blurb |
|---|---|
| before | Find the elapsed time between start and finish times. |
| after | Find the elapsed time between start and finish times, or find a start or finish time given a duration, including across midnight. |

**b. `convert-time-units` blurb re-scope (de-dup)** — old blurb duplicated `convert-12-24-hour-time` (tagged to the same dot point); booklet also drills days↔hours:

| | blurb |
|---|---|
| before | Convert between seconds, minutes and hours and between 12- and 24-hour time. |
| after | Convert between seconds, minutes, hours and days. |

**c. Tag `convert-time-decimal-sexagesimal`** (+`dp-s6st11-time-3`; already `s6-std11`) — Booklet 2 §Converting Units of Time re-teaches the DMS-button method as the core technique for every time calculation in the booklet.

**d. Tag `read-timetables`** (+`s6-std11`, +`dp-s6st11-time-3`) — Booklet 2 Dev Q8 (train timetable) and Q9 (bus timetable) under dp-3's "practical problems… elapsed time".

## 4. Borderline candidates → EXCLUDE

- **`find-end-start-time`** as own node — end/start/elapsed are one taught method family; handled by re-scope 3a, not a split.
- **`utc-offset-difference`** ($1 − (−7) = 8$ h, which city ahead) — integer subtraction ambient; bundled in `utc-problems`/`time-zones-daylight-saving`.
- **`flight-duration-time-zone`** capstone (§Problems Involving Duration and Time Difference, incl. 2018 HSC reverse find-flying-time) — the practical-problem layer of `utc-problems`; no separate node.
- **Decimal/negative GPS coordinates** (Booklet 1 Q15, Google Maps) — digital-tools instance of `latitude-longitude`.

## 5. Considered-and-omitted

- Parallels/meridians identification, $(lat, long)$ coordinates → `latitude-longitude` (tagged).
- $15° = 1$ h from longitudes → `longitude-time-difference` (tagged).
- s/min/h conversions, decimal↔sexagesimal, 12/24-hour → `convert-time-units`, `convert-time-decimal-sexagesimal`, `convert-12-24-hour-time`.
- UTC zone identification, time at another location (±24 wrap), Australian zones, daylight saving adjustments → `time-zones-daylight-saving` + `utc-problems` (tagged).
- HSC-sample Kenya→Borneo question (arc-length distance + speed → duration) — cross-topic graft (circle measurement + rates onto time zones); barred by scope rule.

## Net change

- **1 new skill** (`latitude-longitude-difference`)
- **+1 edge, −1 edge** (net 0: `longitude-time-difference` prereq swap)
- **4 re-scopes** (2 blurbs, 2 tags)

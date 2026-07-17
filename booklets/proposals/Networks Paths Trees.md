# Proposal — Atomise Networks, Paths and Trees (Stage 6 Standard Y11, topic `t-s6st11-networks`)

**Status: APPLIED 2026-07-17** — approved by the user and applied to `data/skills.json`. QUEUE.md row 52 → applied.

## Context

Queue row 52. Two booklets:

1. `Stage 6 Standard/Networks Paths Trees 1_Network concepts.md` → **dp-s6st11-networks-1, -2**
2. `Stage 6 Standard/Networks Paths Trees 2_Shortest paths and spanning trees.md` → **dp-s6st11-networks-3, -4**

MST-11-07.

## Finding (headline)

Topic carried 6 tagged skills (`describe-networks`, `construct-network-diagram`, `solve-network-problems`, `minimum-spanning-tree`, `minimal-connector`, `shortest-path`) — spine complete. One structural gap: **trees and (plain) spanning trees**. dp-3 names "path, tree, spanning tree *and* minimum spanning tree" as terminology, and Booklet 2 spends 3 full sections (connected graphs, tree identification with the $n-1$ edges fact, spanning-tree construction) *before* minimum spanning trees — yet `minimum-spanning-tree` hung directly off `describe-networks`, skipping the whole layer. Plus 3 blurb re-scopes.

## 1. New skills (1) — APPLIED

### `identify-trees-spanning-trees`

```json
{
  "id": "identify-trees-spanning-trees",
  "title": "Identify trees and construct spanning trees",
  "blurb": "Identify connected graphs and trees — exactly one path between any two vertices, $n-1$ edges for $n$ vertices — and construct a spanning tree of a graph by removing edges from loops and cycles.",
  "stage": 6,
  "courses": ["s6-std11"],
  "dotPointIds": ["dp-s6st11-networks-3"],
  "prereqs": ["describe-networks"],
  "difficulty": 2
}
```

**Trace.** Booklet 2: §Connected Graphs (identification drill a–i), §Trees (identification drill a–i + Foundation Q1–2 using $n-1$, Q3 a–f), §Spanning Tree (3-step construction method, example + practice a–d, Foundation Q4 "two different spanning trees", Dev Q5–6 least-wires, Q7 edges-removed count). Reappears in HSC Sample Q4 and 2023 HSC ("is it a *minimum* spanning tree? Justify").

**Edge-bar.** (1) Distinctive — tree recognition and the $n-1$ fact are the characteristic enablers of everything MST. (2) At-risk — ~25 identification parts drilled; HSC asks it directly. (3) Proximity — same stage/topic. (4) Non-redundant — no existing skill carried trees; `minimum-spanning-tree` assumes them.

## 2. New prereq edges (1, net 0 after transitive reduction) — APPLIED

- **`minimum-spanning-tree` ← `identify-trees-spanning-trees`** — Prim's builds on knowing what a spanning tree is; booklet teaches in exactly this order. **Transitive reduction:** dropped `minimum-spanning-tree` ← `describe-networks` (reachable through the new skill).

## 3. Edits to existing skills (3 blurb re-scopes) — APPLIED

**a. `describe-networks`** — dp-1 names "directed networks and weighted edges"; Booklet 1 §Weighted and Directed Graphs is its own section:

| | blurb |
|---|---|
| before | Describe networks (graphs) and identify vertices, edges and degree, recognising a graph can be drawn in different ways. |
| after | Describe networks (graphs) and identify vertices, edges, degree, directed networks and weighted edges, recognising a graph can be drawn in different ways. |

**b. `construct-network-diagram`** — Booklet 1 §Adjacency Matrix drills both directions:

| | blurb |
|---|---|
| before | Construct a weighted, directed network diagram from a table or map. |
| after | Construct a weighted, directed network diagram from a table or map, and represent a network as a table (adjacency matrix). |

**c. `shortest-path`** — two named methods taught (§by inspection; §Dijkstra's Algorithm):

| | blurb |
|---|---|
| before | Identify the shortest path on a network diagram with up to 10 vertices. |
| after | Identify the shortest path on a network diagram with up to 10 vertices, by inspection or using Dijkstra's algorithm. |

## 4. Borderline candidates → EXCLUDE

- **`sum-of-degrees`** (handshake lemma; Booklet 1 Q9–11, 2021 HSC) — degree-counting instances of `describe-networks`; a one-fact node would be pollution.
- **`walk-path-classification`** — already carried by `eulerian-trails-circuits` (s5-path, dp-s5p-net-3); tagging it to Standard would drag Eulerian content into the Standard course view, and the booklet itself says only *paths* matter for HSC Standard. Path definition rides inside the new skill's blurb + `shortest-path`.
- **`dijkstra-algorithm`** as own node — a method within `shortest-path` (handled by re-scope 3c).
- **`shortest-path-vs-mst`** (dp-4 syllabus line; Dev Q4b/Q5b, 2023 HSC part 2) — concept/justification question answered by holding both existing skills; no separate node.
- **`minimal-connector` ← `construct-network-diagram`** edge (table-first questions Q5, 2022 HSC) — table conversion is not the characteristic enabler of connector problems (many give the diagram); fails rule 1.

## 5. Considered-and-omitted

- Vertex/edge/degree identification, real-life network interpretation → `describe-networks` (tagged).
- Weighted/directed graph construction from tables/maps → `construct-network-diagram` (tagged).
- Path lengths on weighted graphs, find-$x$ from path weight, basic practical problems → `solve-network-problems` (tagged).
- Prim's algorithm, reverse MST questions (find $k$ given total weight — 2016/2021 VCE) → `minimum-spanning-tree` (tagged).
- Water pipes / NBN / power points / rail connector contexts, cost-per-unit multiplication → `minimal-connector` (tagged).
- Shortest path by inspection + Dijkstra, HSC variants → `shortest-path` (tagged, re-scoped).

## Net change

- **1 new skill** (`identify-trees-spanning-trees`)
- **+1 edge, −1 edge** (net 0: `minimum-spanning-tree` prereq swap)
- **3 re-scopes** (blurbs: `describe-networks`, `construct-network-diagram`, `shortest-path`)

# Pathfinding Visualizer

An interactive algorithm visualization platform for graph traversal and shortest-path algorithms. Built with React and rendered on an HTML5 canvas-style grid, it lets you watch algorithms think — wall by wall, node by node.

**[Live Demo →](https://pathfinding-algorithm-visualizer-kvb30m21p.vercel.app/)**

---

## What it does

You place a start node and a target node on a grid, draw walls to create obstacles, and then run one of five algorithms. Every node the algorithm visits is animated in real time. When the algorithm terminates, the shortest path (if one exists) is traced back and highlighted separately.

The point isn't just to show that Dijkstra's finds a shortest path. It's to make the *difference* between algorithms immediately obvious — why A\* expands far fewer nodes than BFS on an open grid, or why DFS can produce a wildly inefficient path even when a short one exists.

---

## Algorithms

| Algorithm | Weighted | Shortest path guaranteed |
|---|---|---|
| Dijkstra's | Yes | Yes |
| A\* (Manhattan heuristic) | Yes | Yes |
| Greedy Best-First Search | No | No |
| Breadth-First Search | No | Yes |
| Depth-First Search | No | No |

All five run entirely in the browser with no dependencies beyond React. Each is implemented from scratch rather than pulled from a library, so the code is readable alongside the visualization.

---

## Maze generation

Three procedural generators are included:

- **Recursive Division** — subdivides the grid with walls and leaves a single gap in each, producing structured, room-like mazes.
- **Basic Random** — places walls with uniform probability (~30%), useful for open field benchmarking.
- **Stair Pattern** — a deterministic diagonal pattern for testing path behavior on predictable obstacle layouts.

Walls animate in as they're placed, so generation itself is watchable.

---

## Interaction

- **Draw walls** by clicking and dragging across the grid
- **Erase walls** by clicking an existing wall and dragging
- **Drag the start or target node** to a new position at any time
- **Clear the board, walls only, or path only** without losing other state
- **Control animation speed** — Slow, Medium, Fast, or Instant (no animation, result displayed immediately)

---

## Tech stack

- **React 18** — functional components with hooks throughout
- **Vite** — dev server and build tooling
- **No UI library, no CSS framework** — all styles are written inline or via injected CSS, keeping the bundle minimal

Rendering strategy: the grid is a flat array of `div` elements. During animation, visited and path nodes are updated via direct DOM class manipulation rather than React state — this avoids triggering a reconciliation cycle for every animated cell and keeps frame timing consistent at high node counts. React state is used only for UI elements (navbar dropdowns, button labels, start/finish position) and for intentional full re-renders like clearing the board.

The `Cell` component is wrapped in `React.memo`. Its props only change when the version counter increments (board reset) or when the start/finish position changes. Dropdown opens, speed changes, and the running flag do not propagate to grid cells.

---

## Project structure

```
src/
├── App.jsx          # All algorithms, maze generators, and UI in one file
└── main.jsx         # React root mount

index.html           # Minimal shell, no external fonts or stylesheets
vite.config.js       # Default Vite config
```

The project is intentionally kept as a single-component file. For a project of this scope the overhead of splitting into separate algorithm modules, a grid component, and a controls component adds indirection without adding clarity. If you want to extend it, the logical split points are noted in comments throughout the file.

---

## Getting started

```bash
git clone https://github.com/YOUR_USERNAME/pathfinding-visualizer
cd pathfinding-visualizer
npm install
npm run dev
```

Open `http://localhost:5173`.

To build for production:

```bash
npm run build
```

The output lands in `dist/` and can be served from any static host.

---

## Deployment

The project is deployed on Vercel with zero configuration. Connect the repository on [vercel.com](https://vercel.com), and Vercel will detect the Vite framework, set the build command to `npm run build`, and serve from `dist/`. Every push to `main` triggers a new deployment automatically.

---

## Complexity reference

| Algorithm | Time | Space |
|---|---|---|
| BFS | O(V + E) | O(V) |
| DFS | O(V + E) | O(V) |
| Dijkstra's | O((V + E) log V) | O(V) |
| A\* | O(E log V) | O(V) |
| Greedy Best-First | O(E log V) | O(V) |

On a 20 × 52 grid: V = 1,040 nodes, E ≤ 4,160 edges (4-directional movement, no diagonals).

---

## Known limitations

- No diagonal movement. All traversal is 4-directional (up, down, left, right).
- Weighted nodes (higher traversal cost) are not yet implemented. Dijkstra's and A\* treat all edges as weight 1.
- No mobile touch support. The grid interaction relies on mouse events.
- Grid dimensions are fixed at compile time (20 rows × 52 columns).

These are straightforward to extend and noted here rather than hidden.

---

## License

MIT

import { useState, useRef, useMemo, useCallback, memo } from "react";

// ─── Grid config ─────────────────────────────────────────────────────────────
const R = 22, C = 52;
const SR = 10, SC = 5, FR = 10, FC = 46;
const K = (r, c) => `${r},${c}`;
const H = (r1, c1, r2, c2) => Math.abs(r1 - r2) + Math.abs(c1 - c2);
const D4 = [[1,0],[-1,0],[0,1],[0,-1]];

const getNei = (r, c, W) =>
  D4.map(([dr, dc]) => [r+dr, c+dc])
    .filter(([nr, nc]) => nr >= 0 && nr < R && nc >= 0 && nc < C && !W.has(K(nr, nc)));

const mkPath = (prev, sR, sC, fR, fC) => {
  if (!prev.has(K(fR, fC))) return [];
  const p = []; let cur = [fR, fC];
  while (cur && !(cur[0] === sR && cur[1] === sC)) {
    p.unshift(cur);
    const next = prev.get(K(cur[0], cur[1]));
    if (next === undefined) return [];
    cur = next;
  }
  return p;
};

// ─── BFS ─────────────────────────────────────────────────────────────────────
const algBFS = (sR, sC, fR, fC, W) => {
  const vis = [[sR, sC]], prev = new Map([[K(sR, sC), null]]), q = [[sR, sC]];
  while (q.length) {
    const [r, c] = q.shift();
    if (r === fR && c === fC) break;
    for (const [nr, nc] of getNei(r, c, W)) {
      if (!prev.has(K(nr, nc))) {
        prev.set(K(nr, nc), [r, c]);
        vis.push([nr, nc]);
        q.push([nr, nc]);
      }
    }
  }
  return { vis, path: mkPath(prev, sR, sC, fR, fC) };
};

// ─── DFS (iterative) ─────────────────────────────────────────────────────────
const algDFS = (sR, sC, fR, fC, W) => {
  const vis = [], seen = new Set(), prev = new Map(), stk = [{ r: sR, c: sC, par: null }];
  let found = false;
  while (stk.length && !found) {
    const { r, c, par } = stk.pop();
    if (seen.has(K(r, c))) continue;
    seen.add(K(r, c));
    prev.set(K(r, c), par);
    vis.push([r, c]);
    if (r === fR && c === fC) { found = true; break; }
    for (const [nr, nc] of getNei(r, c, W).reverse()) {
      if (!seen.has(K(nr, nc))) stk.push({ r: nr, c: nc, par: [r, c] });
    }
  }
  return { vis, path: found ? mkPath(prev, sR, sC, fR, fC) : [] };
};

// ─── Dijkstra ─────────────────────────────────────────────────────────────────
const algDijkstra = (sR, sC, fR, fC, W) => {
  const dist = new Map([[K(sR, sC), 0]]), prev = new Map([[K(sR, sC), null]]);
  const vis = [], done = new Set(), pq = [[0, sR, sC]];
  while (pq.length) {
    pq.sort((a, b) => a[0] - b[0]);
    const [d, r, c] = pq.shift();
    if (done.has(K(r, c))) continue;
    done.add(K(r, c)); vis.push([r, c]);
    if (r === fR && c === fC) break;
    for (const [nr, nc] of getNei(r, c, W)) {
      const nd = d + 1;
      if (nd < (dist.get(K(nr, nc)) ?? Infinity)) {
        dist.set(K(nr, nc), nd); prev.set(K(nr, nc), [r, c]); pq.push([nd, nr, nc]);
      }
    }
  }
  return { vis, path: done.has(K(fR, fC)) ? mkPath(prev, sR, sC, fR, fC) : [] };
};

// ─── A* ──────────────────────────────────────────────────────────────────────
const algAStar = (sR, sC, fR, fC, W) => {
  const g = new Map([[K(sR, sC), 0]]), fScore = new Map([[K(sR, sC), H(sR, sC, fR, fC)]]);
  const prev = new Map([[K(sR, sC), null]]);
  const vis = [], closed = new Set(), open = new Set([K(sR, sC)]);
  while (open.size) {
    const cur = [...open].reduce((a, b) => (fScore.get(a) ?? Infinity) < (fScore.get(b) ?? Infinity) ? a : b);
    open.delete(cur); closed.add(cur);
    const [r, c] = cur.split(',').map(Number);
    vis.push([r, c]);
    if (r === fR && c === fC) break;
    for (const [nr, nc] of getNei(r, c, W)) {
      const nk = K(nr, nc);
      if (closed.has(nk)) continue;
      const ng = (g.get(cur) ?? Infinity) + 1;
      if (ng < (g.get(nk) ?? Infinity)) {
        g.set(nk, ng); fScore.set(nk, ng + H(nr, nc, fR, fC));
        prev.set(nk, [r, c]); open.add(nk);
      }
    }
  }
  return { vis, path: closed.has(K(fR, fC)) ? mkPath(prev, sR, sC, fR, fC) : [] };
};

// ─── Greedy Best-First ────────────────────────────────────────────────────────
const algGreedy = (sR, sC, fR, fC, W) => {
  const seen = new Set([K(sR, sC)]), prev = new Map([[K(sR, sC), null]]);
  const vis = [], pq = [[H(sR, sC, fR, fC), sR, sC]];
  while (pq.length) {
    pq.sort((a, b) => a[0] - b[0]);
    const [, r, c] = pq.shift();
    vis.push([r, c]);
    if (r === fR && c === fC) break;
    for (const [nr, nc] of getNei(r, c, W)) {
      if (!seen.has(K(nr, nc))) {
        seen.add(K(nr, nc)); prev.set(K(nr, nc), [r, c]);
        pq.push([H(nr, nc, fR, fC), nr, nc]);
      }
    }
  }
  return { vis, path: seen.has(K(fR, fC)) ? mkPath(prev, sR, sC, fR, fC) : [] };
};

// ─── Maze: Recursive Division ─────────────────────────────────────────────────
const mazeRecDiv = (sR, sC, fR, fC) => {
  const ws = new Set();
  function div(r1, r2, c1, c2) {
    if (r2 - r1 < 2 || c2 - c1 < 2) return;
    const h = (r2 - r1) >= (c2 - c1);
    if (h) {
      const rows = []; for (let r = r1 + 1; r < r2; r += 2) rows.push(r);
      if (!rows.length) return;
      const wr = rows[Math.floor(Math.random() * rows.length)];
      const pc = c1 + Math.floor(Math.random() * (c2 - c1 + 1));
      for (let c = c1; c <= c2; c++) if (c !== pc && !(wr===sR&&c===sC) && !(wr===fR&&c===fC)) ws.add(K(wr, c));
      div(r1, wr - 1, c1, c2); div(wr + 1, r2, c1, c2);
    } else {
      const cols = []; for (let c = c1 + 1; c < c2; c += 2) cols.push(c);
      if (!cols.length) return;
      const wc = cols[Math.floor(Math.random() * cols.length)];
      const pr = r1 + Math.floor(Math.random() * (r2 - r1 + 1));
      for (let r = r1; r <= r2; r++) if (r !== pr && !(r===sR&&wc===sC) && !(r===fR&&wc===fC)) ws.add(K(r, wc));
      div(r1, r2, c1, wc - 1); div(r1, r2, wc + 1, c2);
    }
  }
  div(0, R - 1, 0, C - 1);
  return ws;
};

const mazeRandom = (sR, sC, fR, fC) => {
  const ws = new Set();
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++)
    if (Math.random() < 0.30 && !(r===sR&&c===sC) && !(r===fR&&c===fC)) ws.add(K(r, c));
  return ws;
};

const mazeStair = (sR, sC, fR, fC) => {
  const ws = new Set();
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if ((r===sR&&c===sC)||(r===fR&&c===fC)) continue;
      if (c <= r && r < C) ws.add(K(r, c));
    }
  }
  return ws;
};

// ─── Algo metadata ────────────────────────────────────────────────────────────
const ALGOS = {
  dijkstra: { label: "Dijkstra's Algorithm", info: "Dijkstra's Algorithm is <b>weighted</b> and <b>guarantees</b> the shortest path!" },
  astar: { label: "A* Search", info: "A* Search is <b>weighted</b> and <b>guarantees</b> the shortest path!" },
  greedy: { label: "Greedy Best-first Search", info: "Greedy Best-first Search is <b>unweighted</b> and <b>does not guarantee</b> the shortest path!" },
  bfs: { label: "Breadth-first Search", info: "Breadth-first Search is <b>unweighted</b> and <b>guarantees</b> the shortest path!" },
  dfs: { label: "Depth-first Search", info: "Depth-first Search is <b>unweighted</b> and <b>does not guarantee</b> the shortest path!" },
};

const SPEEDS = { slow: 55, medium: 18, fast: 7, instant: 0 };

// ─── Cell component (memoized) ────────────────────────────────────────────────
const Cell = memo(function Cell({ r, c, cls, isS, isF, onD, onE }) {
  return (
    <div
      id={`n-${r}-${c}`}
      className={`nd ${cls}`}
      onMouseDown={e => onD(e, r, c)}
      onMouseEnter={() => onE(r, c)}
    >
      {isS && <span style={{ color: '#6b21a8', fontSize: 16, lineHeight: 1, pointerEvents: 'none' }}>✱</span>}
      {isF && <span style={{ color: '#111827', fontSize: 16, lineHeight: 1, pointerEvents: 'none' }}>◎</span>}
    </div>
  );
});

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [startPos, setStartPos] = useState([SR, SC]);
  const [finishPos, setFinishPos] = useState([FR, FC]);
  const [version, setVersion] = useState(0);        // bump → full grid re-render
  const [algo, setAlgo] = useState('dijkstra');
  const [spd, setSpd] = useState('fast');
  const [running, setRunning] = useState(false);
  const [aOpen, setAOpen] = useState(false);
  const [mOpen, setMOpen] = useState(false);
  const [sOpen, setSOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const W = useRef(new Set());                       // wall keys
  const runRef = useRef(false);                      // mirrors running state for handlers
  const TOs = useRef([]);                            // animation timeouts
  const anim = useRef(new Map());                    // key → 'v'|'p' (visited / path)
  const mouse = useRef({ down: false, mode: 'wall', drag: null });
  const startRef = useRef([SR, SC]);                 // mirrors startPos for handlers
  const finishRef = useRef([FR, FC]);

  // Sync refs on state change
  const setSP = pos => { startRef.current = pos; setStartPos(pos); };
  const setFP = pos => { finishRef.current = pos; setFinishPos(pos); };
  const bump = () => setVersion(v => v + 1);

  const getEl = (r, c) => document.getElementById(`n-${r}-${c}`);

  const domSet = (r, c, cls) => {
    const el = getEl(r, c);
    if (!el) return;
    el.className = `nd ${cls}`;
    if (cls !== 'nd-s' && cls !== 'nd-f') el.innerHTML = '';
  };

  const stopRun = () => {
    TOs.current.forEach(clearTimeout);
    TOs.current = [];
    runRef.current = false;
    setRunning(false);
  };

  // ── Mouse handlers (stable callbacks — use refs internally) ────────────────
  const onDown = useCallback((e, r, c) => {
    if (runRef.current) return;
    e.preventDefault();
    const [sr, sc] = startRef.current, [fr, fc] = finishRef.current;
    if (r === sr && c === sc) { mouse.current.drag = 'start'; return; }
    if (r === fr && c === fc) { mouse.current.drag = 'finish'; return; }
    mouse.current.down = true;
    const isW = W.current.has(K(r, c));
    mouse.current.mode = isW ? 'erase' : 'wall';
    if (isW) W.current.delete(K(r, c)); else W.current.add(K(r, c));
    domSet(r, c, isW ? 'nd-u' : 'nd-w');
  }, []);

  const onEnter = useCallback((r, c) => {
    if (runRef.current) return;
    const { drag, down, mode } = mouse.current;

    if (drag) {
      const [sr, sc] = startRef.current, [fr, fc] = finishRef.current;
      if (W.current.has(K(r, c))) return;
      if (drag === 'start' && r === fr && c === fc) return;
      if (drag === 'finish' && r === sr && c === sc) return;
      const [or, oc] = drag === 'start' ? [sr, sc] : [fr, fc];
      // Restore old cell
      const a = anim.current.get(K(or, oc));
      domSet(or, oc, a === 'p' ? 'nd-p' : a === 'v' ? 'nd-vi' : 'nd-u');
      // Move
      if (drag === 'start') setSP([r, c]); else setFP([r, c]);
      return;
    }

    if (!down) return;
    const [sr, sc] = startRef.current, [fr, fc] = finishRef.current;
    if ((r === sr && c === sc) || (r === fr && c === fc)) return;
    const sw = mode === 'wall', isW = W.current.has(K(r, c));
    if (isW === sw) return;
    if (sw) W.current.add(K(r, c)); else W.current.delete(K(r, c));
    domSet(r, c, sw ? 'nd-w' : 'nd-u');
  }, []);

  const onUp = useCallback(() => {
    if (mouse.current.drag) mouse.current.drag = null;
    mouse.current.down = false;
  }, []);

  // ── Visualize ──────────────────────────────────────────────────────────────
  const visualize = () => {
    if (runRef.current) return;
    stopRun(); anim.current.clear();
    // Clear previous animation visuals
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      const [sr, sc] = startRef.current, [fr, fc] = finishRef.current;
      if ((r===sr&&c===sc)||(r===fr&&c===fc)||W.current.has(K(r,c))) continue;
      const el = getEl(r, c); if (el) el.className = 'nd nd-u';
    }
    const [sr, sc] = startRef.current, [fr, fc] = finishRef.current;
    let res;
    switch (algo) {
      case 'bfs': res = algBFS(sr, sc, fr, fc, W.current); break;
      case 'dfs': res = algDFS(sr, sc, fr, fc, W.current); break;
      case 'astar': res = algAStar(sr, sc, fr, fc, W.current); break;
      case 'greedy': res = algGreedy(sr, sc, fr, fc, W.current); break;
      default: res = algDijkstra(sr, sc, fr, fc, W.current);
    }
    const { vis, path } = res;
    const delay = SPEEDS[spd];

    if (delay === 0) {
      vis.forEach(([r, c]) => {
        const [sr2,sc2]=startRef.current,[fr2,fc2]=finishRef.current;
        if((r===sr2&&c===sc2)||(r===fr2&&c===fc2)) return;
        const el = getEl(r, c); if (el) el.className = 'nd nd-vi';
        anim.current.set(K(r, c), 'v');
      });
      path.forEach(([r, c]) => {
        const el = getEl(r, c); if (el) el.className = 'nd nd-p';
        anim.current.set(K(r, c), 'p');
      });
      return;
    }

    if (!vis.length) { runRef.current = false; setRunning(false); return; }

    runRef.current = true; setRunning(true);

    vis.forEach(([r, c], i) => {
      const t = setTimeout(() => {
        const [sr2,sc2]=startRef.current,[fr2,fc2]=finishRef.current;
        if(!((r===sr2&&c===sc2)||(r===fr2&&c===fc2))){
          const el = getEl(r, c); if (el) el.className = 'nd nd-vis';
          anim.current.set(K(r, c), 'v');
        }
        if (i === vis.length - 1) {
          if (!path.length) {
            runRef.current = false; setRunning(false);
            setToast('No path found — the target is completely surrounded by walls!');
            setTimeout(() => setToast(null), 3500);
            return;
          }
          path.forEach(([pr, pc], j) => {
            const pt = setTimeout(() => {
              const el2 = getEl(pr, pc); if (el2) el2.className = 'nd nd-p';
              anim.current.set(K(pr, pc), 'p');
              if (j === path.length - 1) { runRef.current = false; setRunning(false); }
            }, j * 45);
            TOs.current.push(pt);
          });
        }
      }, i * delay);
      TOs.current.push(t);
    });
  };

  // ── Board operations ───────────────────────────────────────────────────────
  const clearBoard = () => {
    stopRun(); anim.current.clear();
    // Reset all cells via DOM first
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      const el = getEl(r, c); if (el) el.className = 'nd nd-u';
    }
    W.current.clear();
    setSP([SR, SC]); setFP([FR, FC]);
    bump();
  };

  const clearWalls = () => {
    if (runRef.current) return;
    W.current.forEach(k => { const [r,c]=k.split(',').map(Number); domSet(r,c,'nd-u'); });
    W.current.clear();
  };

  const clearPath = () => {
    stopRun();
    anim.current.forEach((_, k) => { const [r,c]=k.split(',').map(Number); domSet(r,c,'nd-u'); });
    anim.current.clear();
  };

  const genMaze = type => {
    if (runRef.current) return;
    setMOpen(false); clearPath();
    const [sr, sc] = startRef.current, [fr, fc] = finishRef.current;
    // Clear existing walls from DOM
    W.current.forEach(k => { const [r,c]=k.split(',').map(Number); domSet(r,c,'nd-u'); });
    const nw =
      type === 'rdiv' || type === 'rdivH' || type === 'rdivV' ? mazeRecDiv(sr,sc,fr,fc) :
      type === 'stair' ? mazeStair(sr,sc,fr,fc) :
      mazeRandom(sr,sc,fr,fc);
    W.current = nw;
    const wallArr = [...nw].map(k => k.split(',').map(Number));
    wallArr.forEach(([r, c], i) => {
      const t = setTimeout(() => { const el=getEl(r,c); if(el) el.className='nd nd-w'; }, i * 5);
      TOs.current.push(t);
    });
  };

  const close = () => { setAOpen(false); setMOpen(false); setSOpen(false); };

  // ── Cell data (recomputed on position/version change, NOT on dropdown/running) ─
  const cellData = useMemo(() => {
    const [sr, sc] = startPos, [fr, fc] = finishPos;
    return Array.from({ length: R }, (_, r) =>
      Array.from({ length: C }, (_, c) => {
        const isS = r === sr && c === sc;
        const isF = r === fr && c === fc;
        const cls = isS ? 'nd-s' : isF ? 'nd-f' : W.current.has(K(r,c)) ? 'nd-w' : 'nd-u';
        return { isS, isF, cls };
      })
    );
  }, [startPos, finishPos, version]);

  const spdLabel = spd[0].toUpperCase() + spd.slice(1);

  return (
    <div
      style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif", userSelect: 'none', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}
      onMouseUp={onUp}
      onMouseLeave={onUp}
      onClick={close}
    >
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        .nd{
          width:25px;height:25px;
          border-right:1px solid #b3d5f7;
          border-bottom:1px solid #b3d5f7;
          display:flex;align-items:center;justify-content:center;flex-shrink:0;
        }
        .nd-u{background:#fff}
        .nd-s,.nd-f{background:#fff;cursor:grab}
        .nd-w{background:#1e2d3d;animation:wPop .15s ease}
        .nd-vis{animation:vAnim 1.5s ease-out forwards}
        .nd-vi{background:rgba(0,190,218,.75)}
        .nd-p{animation:pAnim 1.5s ease-out forwards}
        @keyframes wPop{
          0%{transform:scale(.3);background:#0c3547}
          50%{transform:scale(1.2)}
          100%{transform:scale(1);background:#1e2d3d}
        }
        @keyframes vAnim{
          0%{transform:scale(.3);background:rgba(0,0,66,.75);border-radius:100%}
          50%{background:rgba(17,104,217,.75)}
          75%{transform:scale(1.2);background:rgba(0,217,159,.75)}
          100%{transform:scale(1);background:rgba(0,190,218,.75);border-radius:0}
        }
        @keyframes pAnim{
          0%{transform:scale(.6);background:rgb(255,254,106)}
          50%{transform:scale(1.2);background:rgb(255,254,106)}
          100%{transform:scale(1);background:rgb(255,254,106)}
        }
        .ddr{position:relative}
        .ddm{
          position:absolute;top:calc(100% + 2px);left:0;
          background:#fff;border:1px solid rgba(0,0,0,.1);
          border-radius:4px;box-shadow:0 8px 28px rgba(0,0,0,.14);
          z-index:400;min-width:195px;overflow:hidden
        }
        .ddi{padding:9px 16px;font-size:13px;color:#2d3748;cursor:pointer;white-space:nowrap}
        .ddi:hover{background:#f0f4f8}
        .ddi.on{background:#2c7a7b;color:#fff}
        .ddi-sep{height:1px;background:#e8ecf1;margin:3px 0}
        .na{
          background:none;border:none;color:rgba(255,255,255,.92);
          font-size:13px;cursor:pointer;padding:6px 10px;
          border-radius:4px;white-space:nowrap;font-family:inherit;
          display:flex;align-items:center;gap:4px;transition:background .12s;
          line-height:1.4
        }
        .na:hover{background:rgba(255,255,255,.09)}
        .na.fw{font-weight:600}
        .vb{
          background:#38b2ac;border:none;color:#fff;font-size:13px;
          font-weight:700;cursor:pointer;padding:7px 15px;border-radius:4px;
          white-space:nowrap;font-family:inherit;letter-spacing:.3px;
          transition:background .12s
        }
        .vb:hover:not(:disabled){background:#2c9a95}
        .vb:disabled{opacity:.55;cursor:not-allowed}
      `}</style>

      {/* ─── Navbar ─────────────────────────────────────────────────────────── */}
      <nav
        style={{ background: '#293241', display: 'flex', alignItems: 'center', padding: '0 14px', height: '48px', gap: '2px', flexShrink: 0, position: 'relative', zIndex: 200 }}
        onClick={e => e.stopPropagation()}
      >
        <span style={{ color: '#fff', fontWeight: 800, fontSize: '15px', marginRight: '10px', letterSpacing: '-.2px', whiteSpace: 'nowrap' }}>
          Pathfinding Visualizer
        </span>

        {/* Algorithms */}
        <div className="ddr">
          <button className="na fw" onClick={e => { e.stopPropagation(); setAOpen(o => !o); setMOpen(false); setSOpen(false); }}>
            Algorithms <span style={{ fontSize: '9px', opacity: .65 }}>▼</span>
          </button>
          {aOpen && (
            <div className="ddm">
              {Object.entries(ALGOS).map(([id, { label }]) => (
                <div key={id} className={`ddi${algo === id ? ' on' : ''}`}
                  onClick={e => { e.stopPropagation(); setAlgo(id); setAOpen(false); }}>
                  {label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mazes */}
        <div className="ddr">
          <button className="na fw" onClick={e => { e.stopPropagation(); setMOpen(o => !o); setAOpen(false); setSOpen(false); }}>
            Mazes & Patterns <span style={{ fontSize: '9px', opacity: .65 }}>▼</span>
          </button>
          {mOpen && (
            <div className="ddm">
              {[
                { id: 'rdiv', label: 'Recursive Division' },
                { id: 'rdivH', label: 'Recursive Division (Horizontal Skew)' },
                { id: 'rdivV', label: 'Recursive Division (Vertical Skew)' },
              ].map(({ id, label }) => (
                <div key={id} className="ddi" onClick={e => { e.stopPropagation(); genMaze(id); }}>{label}</div>
              ))}
              <div className="ddi-sep" />
              {[
                { id: 'rnd', label: 'Basic Random Maze' },
                { id: 'stair', label: 'Stair Pattern' },
              ].map(({ id, label }) => (
                <div key={id} className="ddi" onClick={e => { e.stopPropagation(); genMaze(id); }}>{label}</div>
              ))}
            </div>
          )}
        </div>

        <button className="na">Add Bomb</button>

        <button className="vb" disabled={running} onClick={visualize}>
          Visualize {ALGOS[algo].label}!
        </button>

        <button className="na" onClick={() => { close(); clearBoard(); }}>Clear Board</button>
        <button className="na" onClick={() => { close(); clearWalls(); }}>Clear Walls & Weights</button>
        <button className="na" onClick={() => { close(); clearPath(); }}>Clear Path</button>

        {/* Speed */}
        <div className="ddr" style={{ marginLeft: 'auto' }}>
          <button className="na" onClick={e => { e.stopPropagation(); setSOpen(o => !o); setAOpen(false); setMOpen(false); }}>
            Speed: {spdLabel} <span style={{ fontSize: '9px', opacity: .65 }}>▼</span>
          </button>
          {sOpen && (
            <div className="ddm" style={{ right: 0, left: 'auto' }}>
              {['slow', 'medium', 'fast', 'instant'].map(s => (
                <div key={s} className={`ddi${spd === s ? ' on' : ''}`}
                  onClick={e => { e.stopPropagation(); setSpd(s); setSOpen(false); }}>
                  {s[0].toUpperCase() + s.slice(1)}
                </div>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* ─── Legend ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '8px 20px', background: '#fff', borderBottom: '1px solid #e8ecf1', flexShrink: 0, flexWrap: 'wrap' }}>
        {[
          { lbl: 'Start Node', el: <span style={{ color: '#6b21a8', fontSize: 20, lineHeight: 1 }}>✱</span> },
          { lbl: 'Target Node', el: <span style={{ fontSize: 17, color: '#111827', lineHeight: 1 }}>◎</span> },
          { lbl: 'Weight Node', el: <span style={{ fontSize: 14, textDecoration: 'line-through', opacity: .55 }}>🔒</span> },
          { lbl: 'Unvisited Node', el: <div style={{ width: 18, height: 18, border: '1px solid #c5d5e4', background: '#fff' }} /> },
          { lbl: 'Visited Nodes', el: <div style={{ width: 18, height: 18, background: 'linear-gradient(135deg,#00bcd4 0%,#9c27b0 100%)' }} /> },
          { lbl: 'Shortest-path Node', el: <div style={{ width: 18, height: 18, background: 'rgb(255,254,106)', border: '1px solid #d4d400' }} /> },
          { lbl: 'Wall Node', el: <div style={{ width: 18, height: 18, background: '#1e2d3d' }} /> },
        ].map(({ lbl, el }) => (
          <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>
            {el}
            <span>{lbl}</span>
          </div>
        ))}
      </div>

      {/* ─── Info banner ────────────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', padding: '7px', fontSize: 13.5, color: '#374151', background: '#f8f9fa', borderBottom: '1px solid #e8ecf1', flexShrink: 0 }}>
        <span dangerouslySetInnerHTML={{ __html: ALGOS[algo].info }} />
      </div>

      {/* ─── Grid ───────────────────────────────────────────────────────────── */}
      <div
        style={{ flex: 1, overflow: 'auto', background: '#eef4f9', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 16 }}
      >
        <div
          style={{ display: 'inline-flex', flexDirection: 'column', borderTop: '1px solid #b3d5f7', borderLeft: '1px solid #b3d5f7', lineHeight: 0, background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,.07)', cursor: 'crosshair' }}
        >
          {cellData.map((row, r) => (
            <div key={r} style={{ display: 'flex' }}>
              {row.map(({ isS, isF, cls }, c) => (
                <Cell key={c} r={r} c={c} cls={cls} isS={isS} isF={isF} onD={onDown} onE={onEnter} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

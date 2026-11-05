// SPDX-License-Identifier: MIT
// Copyright (c) 2026 RICHARDwuxiaofei
import type { Part, Vec3 } from "./model";
const EPS = 1e-7;
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const length = (a: Vec3) => Math.sqrt(dot(a, a));
const bounds = (vs: Vec3[]) =>
  [0, 1, 2].map((k) => [
    Math.min(...vs.map((v) => v[k])),
    Math.max(...vs.map((v) => v[k])),
  ]);
const overlap = (a: number[][], b: number[][]) =>
  a.every((r, k) => r[1] >= b[k][0] - EPS && b[k][1] >= r[0] - EPS);
function inTriangle(p: Vec3, t: Vec3[]) {
  const u = sub(t[1], t[0]),
    v = sub(t[2], t[0]),
    w = sub(p, t[0]);
  const uu = dot(u, u),
    uv = dot(u, v),
    vv = dot(v, v),
    wu = dot(w, u),
    wv = dot(w, v),
    den = uu * vv - uv * uv;
  if (Math.abs(den) < 1e-20) return false;
  const a = (vv * wu - uv * wv) / den,
    b = (uu * wv - uv * wu) / den;
  return a >= -EPS && b >= -EPS && a + b <= 1 + EPS;
}
/** Positive-area coplanar overlap, or a non-coplanar intersection away from shared vertices. */
export function trianglesIntersect(a: Vec3[], b: Vec3[], shared: Vec3[] = []) {
  const n = cross(sub(a[1], a[0]), sub(a[2], a[0])),
    nl = length(n);
  if (nl < EPS) return false;
  const distances = b.map((p) => dot(n, sub(p, a[0])) / nl);
  if (distances.every((d) => d > EPS) || distances.every((d) => d < -EPS))
    return false;
  if (distances.every((d) => Math.abs(d) < EPS)) {
    const axis = n.map(Math.abs).indexOf(Math.max(...n.map(Math.abs)));
    const project = (p: Vec3) => p.filter((_, k) => k !== axis);
    const aa = a.map(project);
    let polygon = b.map(project);
    const orient = (p: number[], q: number[], r: number[]) =>
      (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
    const sign = Math.sign(orient(aa[0], aa[1], aa[2]));
    for (const [u, v] of [
      [aa, polygon],
      [polygon, aa],
    ]) {
      const direction = Math.sign(orient(u[0], u[1], u[2]));
      for (let edge = 0; edge < 3; edge++)
        if (
          Math.max(
            ...v.map(
              (point) => direction * orient(u[edge], u[(edge + 1) % 3], point),
            ),
          ) <= 1e-10
        )
          return false;
    }
    for (let i = 0; i < 3 && polygon.length; i++) {
      const p = aa[i],
        q = aa[(i + 1) % 3],
        next: number[][] = [];
      for (let j = 0; j < polygon.length; j++) {
        const u = polygon[j],
          v = polygon[(j + 1) % polygon.length],
          du = sign * orient(p, q, u),
          dv = sign * orient(p, q, v);
        if (du >= 0) next.push(u);
        if (du >= 0 !== dv >= 0) {
          const t = du / (du - dv);
          next.push([u[0] + t * (v[0] - u[0]), u[1] + t * (v[1] - u[1])]);
        }
      }
      polygon = next;
    }
    let area = 0;
    for (let i = 0; i < polygon.length; i++) {
      const p = polygon[i],
        q = polygon[(i + 1) % polygon.length];
      area += p[0] * q[1] - p[1] * q[0];
    }
    return Math.abs(area) > 1e-8;
  }
  for (const [edges, plane] of [
    [a, b],
    [b, a],
  ]) {
    const normal = cross(sub(plane[1], plane[0]), sub(plane[2], plane[0]));
    const norm = length(normal);
    for (let i = 0; i < 3; i++) {
      const u = edges[i],
        v = edges[(i + 1) % 3],
        du = dot(normal, sub(u, plane[0])) / norm,
        dv = dot(normal, sub(v, plane[0])) / norm;
      if (
        (du > EPS && dv > EPS) ||
        (du < -EPS && dv < -EPS) ||
        Math.abs(du - dv) < 1e-12
      )
        continue;
      const t = du / (du - dv);
      if (t < -EPS || t > 1 + EPS) continue;
      const p = u.map((x, k) => x + t * (v[k] - x)) as Vec3;
      if (
        inTriangle(p, plane) &&
        !shared.some((s) => length(sub(p, s)) < EPS * 10)
      )
        return true;
    }
  }
  return false;
}
function contains(point: Vec3, triangles: Vec3[][]) {
  let angle = 0;
  for (const t of triangles) {
    const [a, b, c] = t.map((p) => sub(p, point)),
      la = length(a),
      lb = length(b),
      lc = length(c);
    angle +=
      2 *
      Math.atan2(
        dot(a, cross(b, c)),
        la * lb * lc + dot(a, b) * lc + dot(b, c) * la + dot(c, a) * lb,
      );
  }
  return Math.abs(angle) > Math.PI * 2;
}
export function validateMesh(part: Part) {
  const result = {
    valid: false,
    badEdges: 0,
    degenerate: 0,
    volume: 0,
    nonManifoldVertices: 0,
    intersections: 0,
    shells: [] as { triangles: number; volume: number; depth: number }[],
    issues: [] as string[],
  };
  const { vertices, triangles } = part;
  if (
    !vertices.length ||
    !triangles.length ||
    vertices.some((v) => v.length !== 3 || v.some((n) => !Number.isFinite(n)))
  ) {
    result.degenerate = 1;
    result.issues.push("empty/nonfinite mesh");
    return result;
  }
  const edges = new Map<string, { faces: number[]; balance: number }>(),
    incident = new Map<number, number[]>();
  const parent = triangles.map((_, i) => i);
  const root = (i: number): number =>
    parent[i] === i ? i : (parent[i] = root(parent[i]));
  const raw: Vec3[][] = [];
  const boxes: number[][][] = [];
  for (let i = 0; i < triangles.length; i++) {
    const t = triangles[i];
    if (
      t.length !== 3 ||
      new Set(t).size !== 3 ||
      t.some((k) => !Number.isInteger(k) || k < 0 || k >= vertices.length)
    ) {
      result.degenerate++;
      raw.push([]);
      boxes.push([]);
      continue;
    }
    const vs = t.map((k) => vertices[k]);
    raw.push(vs);
    boxes.push(bounds(vs));
    if (length(cross(sub(vs[1], vs[0]), sub(vs[2], vs[0]))) < 1e-9)
      result.degenerate++;
    for (const v of t) {
      const fs = incident.get(v) ?? [];
      fs.push(i);
      incident.set(v, fs);
    }
    for (let j = 0; j < 3; j++) {
      const u = t[j],
        v = t[(j + 1) % 3],
        key = u < v ? `${u},${v}` : `${v},${u}`,
        e = edges.get(key) ?? { faces: [], balance: 0 };
      if (e.faces.length) parent[root(i)] = root(e.faces[0]);
      e.faces.push(i);
      e.balance += u < v ? 1 : -1;
      edges.set(key, e);
    }
  }
  result.badEdges = [...edges.values()].filter(
    (e) => e.faces.length !== 2 || e.balance !== 0,
  ).length;
  if (result.badEdges || result.degenerate) {
    result.issues.push("open/inconsistently oriented/degenerate triangles");
    return result;
  }
  // The face fan at each vertex must be a single cycle, not a pinched bow-tie.
  const neighbors = triangles.map(() => [] as number[]);
  for (const e of edges.values()) {
    neighbors[e.faces[0]].push(e.faces[1]);
    neighbors[e.faces[1]].push(e.faces[0]);
  }
  for (const [v, fs] of incident) {
    const allowed = new Set(fs),
      seen = new Set<number>(),
      queue = [fs[0]];
    while (queue.length) {
      const f = queue.pop()!;
      if (seen.has(f)) continue;
      seen.add(f);
      for (const g of neighbors[f])
        if (allowed.has(g) && triangles[g].includes(v) && !seen.has(g))
          queue.push(g);
    }
    if (seen.size !== fs.length) result.nonManifoldVertices++;
  }
  if (result.nonManifoldVertices) {
    result.issues.push("disconnected vertex fan");
    return result;
  }
  const groups = new Map<number, number[]>();
  for (let i = 0; i < triangles.length; i++) {
    const r = root(i),
      g = groups.get(r) ?? [];
    g.push(i);
    groups.set(r, g);
  }
  const shells = [...groups.values()];
  // Sweep in X then reject triangle AABBs in Y/Z before exact triangle intersection.
  const order = triangles
    .map((_, i) => i)
    .sort((a, b) => boxes[a][0][0] - boxes[b][0][0]);
  let budget = 0;
  for (let ii = 0; ii < order.length; ii++) {
    const i = order[ii];
    for (let jj = ii + 1; jj < order.length; jj++) {
      const j = order[jj];
      if (boxes[j][0][0] > boxes[i][0][1] + EPS) break;
      if (!overlap(boxes[i], boxes[j])) continue;
      const shared = triangles[i]
        .filter((k) => triangles[j].includes(k))
        .map((k) => vertices[k]);

      if (++budget > 3000000) {
        result.issues.push("intersection budget exceeded");
        return result;
      }
      if (trianglesIntersect(raw[i], raw[j], shared)) {
        result.intersections++;
        result.issues.push(`intersecting triangles ${i}/${j}`);
        return result;
      }
    }
  }
  const shellBoxes = shells.map((fs) => bounds(fs.flatMap((i) => raw[i])));
  for (let s = 0; s < shells.length; s++) {
    const fs = shells[s],
      origin = raw[fs[0]][0];
    let volume = 0,
      depth = 0;
    for (const f of fs) {
      const [a, b, c] = raw[f].map((v) => sub(v, origin));
      volume += dot(a, cross(b, c)) / 6;
    }
    for (let other = 0; other < shells.length; other++) {
      if (s === other) continue;
      const box = shellBoxes[other];
      if (
        origin.every((n, k) => n >= box[k][0] - EPS && n <= box[k][1] + EPS) &&
        contains(
          origin,
          shells[other].map((f) => raw[f]),
        )
      )
        depth++;
    }
    result.shells.push({ triangles: fs.length, volume, depth });
    result.volume += volume;
    if (
      Math.abs(volume) < 1e-7 ||
      Math.sign(volume) !== (depth % 2 === 0 ? 1 : -1)
    )
      result.issues.push(
        `shell ${s}: wrong orientation at nesting depth ${depth}`,
      );
  }
  result.valid = !result.issues.length && result.volume > 1e-7;
  return result;
}

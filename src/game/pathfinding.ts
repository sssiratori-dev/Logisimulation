import type { City, Road, PathResult } from './types';

export function findShortestPath(
  fromId: string,
  toId: string,
  cities: City[],
  roads: Road[]
): PathResult | null {
  if (fromId === toId) return { path: [fromId], totalDistance: 0 };

  // Build adjacency list
  const adj: Map<string, { to: string; dist: number }[]> = new Map();
  for (const city of cities) {
    adj.set(city.id, []);
  }
  for (const road of roads) {
    adj.get(road.fromId)?.push({ to: road.toId, dist: road.distance });
    adj.get(road.toId)?.push({ to: road.fromId, dist: road.distance });
  }

  // Dijkstra
  const dist: Map<string, number> = new Map();
  const prev: Map<string, string | null> = new Map();
  const unvisited = new Set<string>(cities.map((c) => c.id));

  for (const city of cities) {
    dist.set(city.id, Infinity);
    prev.set(city.id, null);
  }
  dist.set(fromId, 0);

  while (unvisited.size > 0) {
    let u: string | null = null;
    let minDist = Infinity;
    for (const id of unvisited) {
      const d = dist.get(id) ?? Infinity;
      if (d < minDist) {
        minDist = d;
        u = id;
      }
    }

    if (u === null || minDist === Infinity) break;
    if (u === toId) break;

    unvisited.delete(u);

    for (const neighbor of adj.get(u) ?? []) {
      if (!unvisited.has(neighbor.to)) continue;
      const alt = (dist.get(u) ?? Infinity) + neighbor.dist;
      if (alt < (dist.get(neighbor.to) ?? Infinity)) {
        dist.set(neighbor.to, alt);
        prev.set(neighbor.to, u);
      }
    }
  }

  if ((dist.get(toId) ?? Infinity) === Infinity) return null;

  // Reconstruct path
  const path: string[] = [];
  let current: string | null = toId;
  while (current !== null) {
    path.unshift(current);
    current = prev.get(current) ?? null;
  }

  return { path, totalDistance: dist.get(toId) ?? 0 };
}

export function getRoadBetween(fromId: string, toId: string, roads: Road[]): Road | null {
  return (
    roads.find(
      (r) =>
        (r.fromId === fromId && r.toId === toId) || (r.fromId === toId && r.toId === fromId)
    ) ?? null
  );
}

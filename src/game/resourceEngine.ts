import type { GameState, ResourceType, ResourceStock, WagonOrder } from './types';
import { TERRAIN_FACTORS } from './types';
import {
  FOOD_PER_PERSON,
  POPULATION_LOSS_RATE,
  CORRUPTION_THRESHOLD,
  nextWagonId,
  WAGON_TICKS_PER_100KM,
} from './initialData';
import { getRoadBetween } from './pathfinding';

export const RESOURCE_LABELS: Record<ResourceType, string> = {
  food: '🌾 食料',
  iron: '⚙️ 鉄',
  book: '📚 書物',
  monster_parts: '🦴 魔物素材',
};

/** Process one resource turn (food consumption, population change). */
export function processResourceTurn(state: GameState, log: string[]): GameState {
  const cities = state.cities.map((city) => {
    const foodConsumed = Math.floor(city.population * FOOD_PER_PERSON);
    const foodAvailable = city.resources.food;

    if (foodAvailable >= foodConsumed) {
      return {
        ...city,
        resources: { ...city.resources, food: foodAvailable - foodConsumed },
      };
    }

    // Food shortage → population decline
    const deficit = foodConsumed - foodAvailable;
    const popLoss = Math.min(city.population, Math.ceil(deficit * POPULATION_LOSS_RATE));
    const newPop = city.population - popLoss;

    log.push(
      `⚠️ ${city.name}: 食料不足 (-${deficit}) → 人口 ${city.population}→${newPop} (-${popLoss})`
    );

    return {
      ...city,
      population: Math.max(0, newPop),
      resources: { ...city.resources, food: 0 },
    };
  });

  return { ...state, cities };
}

/** Process arriving wagon orders and accumulate corruption. */
export function processWagonArrivals(state: GameState, log: string[]): GameState {
  let corruption = state.corruption;
  let chaosActive = state.chaosActive;

  const cities = state.cities.map((c) => ({ ...c, resources: { ...c.resources } }));

  const wagonOrders = state.wagonOrders.map((wo) => {
    if (wo.status !== 'in_transit' || wo.arriveTick > state.tick) return wo;

    // Add surviving resources to destination city
    const destIdx = cities.findIndex((c) => c.id === wo.toId);
    const fromCity = state.cities.find((c) => c.id === wo.fromId);
    const toCity = cities[destIdx];

    if (destIdx !== -1) {
      const arrivedParts: string[] = [];
      for (const [key, amount] of Object.entries(wo.items) as [ResourceType, number][]) {
        if (!amount) continue;
        const lost = wo.lostItems[key] ?? 0;
        const survived = amount - lost;
        cities[destIdx] = {
          ...toCity,
          resources: { ...cities[destIdx].resources, [key]: cities[destIdx].resources[key] + survived },
        };
        arrivedParts.push(`${RESOURCE_LABELS[key]} ${survived}`);
        corruption += lost;
      }
      log.push(
        `🐴 荷馬車到着: ${fromCity?.name}→${toCity?.name} [${arrivedParts.join(', ')}]`
      );
    }

    // Check corruption threshold
    if (!chaosActive && corruption >= CORRUPTION_THRESHOLD) {
      chaosActive = true;
      log.push(`🔥 カオスイベント発生！腐敗値が ${Math.floor(corruption)} に達した！`);
    }

    return { ...wo, status: 'arrived' as const };
  });

  return { ...state, cities, wagonOrders, corruption, chaosActive };
}

/** Issue a new wagon transport order. Deducts resources from source city immediately. */
export function issueWagonOrder(
  state: GameState,
  fromId: string,
  toId: string,
  items: Partial<ResourceStock>
): GameState {
  const fromIdx = state.cities.findIndex((c) => c.id === fromId);
  if (fromIdx === -1) return state;

  const road = getRoadBetween(fromId, toId, state.roads);
  if (!road) {
    return {
      ...state,
      log: [...state.log, `❌ ${fromId} と ${toId} の間に直通道路がありません`],
    };
  }

  const fromCity = state.cities[fromIdx];
  const cities = state.cities.map((c) => ({ ...c, resources: { ...c.resources } }));

  // Validate and deduct
  const deducted: Partial<ResourceStock> = {};
  for (const [key, amount] of Object.entries(items) as [ResourceType, number][]) {
    if (!amount || amount <= 0) continue;
    if (fromCity.resources[key] < amount) {
      return {
        ...state,
        log: [
          ...state.log,
          `❌ ${fromCity.name}: ${RESOURCE_LABELS[key]} が不足しています (${fromCity.resources[key]} < ${amount})`,
        ],
      };
    }
    cities[fromIdx] = {
      ...cities[fromIdx],
      resources: { ...cities[fromIdx].resources, [key]: cities[fromIdx].resources[key] - amount },
    };
    deducted[key] = amount;
  }

  if (Object.keys(deducted).length === 0) return state;

  // Calculate transit loss
  const factor = TERRAIN_FACTORS[road.terrain];
  const lostItems: Partial<ResourceStock> = {};
  for (const [key, amount] of Object.entries(deducted) as [ResourceType, number][]) {
    lostItems[key] = Math.floor(amount * (1 - factor));
  }

  // Arrival tick: distance / 100 * WAGON_TICKS_PER_100KM
  const travelTicks = Math.ceil((road.distance / 100) * WAGON_TICKS_PER_100KM);
  const arriveTick = state.tick + travelTicks;

  const wo: WagonOrder = {
    id: nextWagonId(),
    fromId,
    toId,
    items: deducted,
    unit: 'wagon',
    terrain: road.terrain,
    departTick: state.tick,
    arriveTick,
    lostItems,
    status: 'in_transit',
  };

  const toCity = state.cities.find((c) => c.id === toId);
  const itemSummary = Object.entries(deducted)
    .map(([k, v]) => `${RESOURCE_LABELS[k as ResourceType]} ${v}`)
    .join(', ');

  return {
    ...state,
    cities,
    wagonOrders: [...state.wagonOrders, wo],
    log: [
      ...state.log,
      `🐴 輸送命令: ${fromCity.name}→${toCity?.name} [${itemSummary}] (地形: ${road.terrain}, ${travelTicks}tick後到着)`,
    ],
  };
}

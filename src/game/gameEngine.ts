import type { GameState, Truck } from './types';
import { findShortestPath, getRoadBetween } from './pathfinding';
import { generateOrder, MAINTENANCE_PER_TICK, TRUCK_COST, nextTruckId, RESOURCE_TURN_INTERVAL } from './initialData';
import { processResourceTurn, processWagonArrivals } from './resourceEngine';

const ORDER_SPAWN_INTERVAL = 30;
const MAX_PENDING_ORDERS = 12;

export function tick(state: GameState): GameState {
  if (state.paused) return state;

  const newTick = state.tick + 1;
  const log: string[] = [...state.log];

  // Maintenance costs
  let money = state.money - state.trucks.length * MAINTENANCE_PER_TICK;

  // Update trucks
  const trucks = state.trucks.map((truck) => updateTruck(truck, state, log));

  // Work on a mutable copy of orders
  const orders = state.orders.map((o) => ({ ...o }));

  let score = state.score;
  let expiredCount = state.expiredCount;
  let deliveredCount = state.deliveredCount;

  // Detect deliveries: truck just arrived at final destination (idle with assignedOrder in_transit)
  for (const truck of trucks) {
    if (truck.status !== 'idle' || !truck.assignedOrderId) continue;
    const prevTruck = state.trucks.find((t) => t.id === truck.id);
    if (!prevTruck || prevTruck.status === 'idle') continue; // was already idle

    const orderIdx = orders.findIndex((o) => o.id === truck.assignedOrderId);
    if (orderIdx === -1) continue;
    const order = orders[orderIdx];
    if (order.status !== 'in_transit') continue;

    const latePenalty = Math.max(0, (newTick - order.deadline) * order.penalty);
    const earned = Math.max(Math.round(order.reward * 0.1), order.reward - latePenalty);
    money += earned;
    score += Math.round(earned / 1000);
    deliveredCount++;
    orders[orderIdx] = { ...order, status: 'delivered' };

    const toCity = state.cities.find((c) => c.id === order.toId);
    log.push(`✅ 配送完了: ${order.cargo} → ${toCity?.name} +¥${earned.toLocaleString()}`);
  }

  // Expire overdue pending orders
  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    if (order.status === 'pending' && newTick > order.deadline) {
      expiredCount++;
      money -= order.penalty * 10;
      const from = state.cities.find((c) => c.id === order.fromId);
      const to = state.cities.find((c) => c.id === order.toId);
      log.push(`⚠️ 期限切れ: ${order.cargo} (${from?.name}→${to?.name})`);
      orders[i] = { ...order, status: 'expired' };
    }
  }

  // Filter out old completed orders
  const activeOrders = orders.filter(
    (o) =>
      o.status === 'pending' ||
      o.status === 'in_transit' ||
      (o.status === 'delivered' && newTick - o.deadline < 50) ||
      (o.status === 'expired' && newTick - o.deadline < 50)
  );

  // Spawn new orders
  if (
    newTick % ORDER_SPAWN_INTERVAL === 0 &&
    activeOrders.filter((o) => o.status === 'pending').length < MAX_PENDING_ORDERS
  ) {
    const newOrder = generateOrder(state.cities, newTick);
    activeOrders.push(newOrder);
    const fromCity = state.cities.find((c) => c.id === newOrder.fromId);
    const toCity = state.cities.find((c) => c.id === newOrder.toId);
    log.push(
      `📦 新規注文: ${newOrder.cargo} (${fromCity?.name}→${toCity?.name}) ¥${newOrder.reward.toLocaleString()}`
    );
  }

  // Clear assignedOrderId from trucks whose order is no longer active
  const finalTrucks = trucks.map((truck) => {
    if (!truck.assignedOrderId) return truck;
    const order = activeOrders.find((o) => o.id === truck.assignedOrderId);
    if (!order || order.status === 'delivered' || order.status === 'expired') {
      return { ...truck, assignedOrderId: undefined };
    }
    return truck;
  });

  // ── Resource system ───────────────────────────────────────────────────────

  // Process wagon arrivals every tick
  let resourceState: GameState = {
    ...state,
    tick: newTick,
    money,
    score,
    trucks: finalTrucks,
    orders: activeOrders,
    deliveredCount,
    expiredCount,
    log: log.slice(-50),
  };
  resourceState = processWagonArrivals(resourceState, log);

  // Food consumption every RESOURCE_TURN_INTERVAL ticks
  if (newTick % RESOURCE_TURN_INTERVAL === 0) {
    resourceState = processResourceTurn(resourceState, log);
  }

  return { ...resourceState, log: log.slice(-50) };
}

function updateTruck(truck: Truck, state: GameState, log: string[]): Truck {
  if (truck.status === 'idle' || !truck.routePath || truck.routePath.length < 2) {
    return truck;
  }

  const currentIdx = truck.routePath.indexOf(truck.currentCityId);
  if (currentIdx === -1 || currentIdx >= truck.routePath.length - 1) {
    return { ...truck, status: 'idle', targetCityId: undefined, routePath: undefined, progress: 0 };
  }

  const nextCityId = truck.routePath[currentIdx + 1];
  const road = getRoadBetween(truck.currentCityId, nextCityId, state.roads);
  if (!road) return { ...truck, status: 'idle' };

  const progressPerTick = truck.speed / road.distance;
  const newProgress = truck.progress + progressPerTick;

  if (newProgress >= 1) {
    const remaining = truck.routePath.slice(currentIdx + 1);
    const arrivedCity = state.cities.find((c) => c.id === nextCityId);

    if (remaining.length <= 1) {
      // Final destination
      log.push(`🚚 ${truck.name} が ${arrivedCity?.name} に到着`);
      return {
        ...truck,
        currentCityId: nextCityId,
        targetCityId: undefined,
        routePath: undefined,
        progress: 0,
        status: 'idle',
      };
    } else {
      return { ...truck, currentCityId: nextCityId, progress: 0, status: 'moving' };
    }
  }

  return { ...truck, progress: newProgress, status: 'moving', targetCityId: nextCityId };
}

export function assignOrderToTruck(state: GameState, truckId: string, orderId: string): GameState {
  const truck = state.trucks.find((t) => t.id === truckId);
  const order = state.orders.find((o) => o.id === orderId);

  if (!truck || !order) return state;
  if (truck.status !== 'idle') return state;
  if (order.status !== 'pending') return state;

  const finalPath = buildFullPath(truck.currentCityId, order.fromId, order.toId, state);
  if (!finalPath) return state;

  const fromCity = state.cities.find((c) => c.id === order.fromId);
  const toCity = state.cities.find((c) => c.id === order.toId);
  const log = [
    ...state.log,
    `🚚 ${truck.name}: ${order.cargo} の配送開始 (${fromCity?.name}→${toCity?.name})`,
  ];

  const updatedTrucks = state.trucks.map((t) =>
    t.id === truckId
      ? {
          ...t,
          assignedOrderId: orderId,
          routePath: finalPath,
          status: 'moving' as const,
          targetCityId: finalPath[1],
          progress: 0,
        }
      : t
  );

  const updatedOrders = state.orders.map((o) =>
    o.id === orderId ? { ...o, status: 'in_transit' as const, assignedTruckId: truckId } : o
  );

  return { ...state, trucks: updatedTrucks, orders: updatedOrders, log };
}

function buildFullPath(
  truckCity: string,
  pickupCity: string,
  deliveryCity: string,
  state: GameState
): string[] | null {
  if (truckCity === pickupCity) {
    const result = findShortestPath(pickupCity, deliveryCity, state.cities, state.roads);
    return result?.path ?? null;
  }

  const toPickup = findShortestPath(truckCity, pickupCity, state.cities, state.roads);
  const toDelivery = findShortestPath(pickupCity, deliveryCity, state.cities, state.roads);

  if (!toPickup || !toDelivery) return null;

  return [...toPickup.path, ...toDelivery.path.slice(1)];
}

export function buyTruck(state: GameState, atCityId: string): GameState {
  if (state.money < TRUCK_COST) return state;

  const id = nextTruckId();
  const newTruck = {
    id,
    name: `トラック${state.trucks.length + 1}`,
    currentCityId: atCityId,
    progress: 0,
    status: 'idle' as const,
    speed: 80,
    capacity: 1,
    purchaseCost: TRUCK_COST,
    maintenanceCostPerTick: MAINTENANCE_PER_TICK,
  };

  return {
    ...state,
    money: state.money - TRUCK_COST,
    trucks: [...state.trucks, newTruck],
    log: [
      ...state.log,
      `🛒 新しいトラックを ${state.cities.find((c) => c.id === atCityId)?.name} で購入しました`,
    ],
  };
}

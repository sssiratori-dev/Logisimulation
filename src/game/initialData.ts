import type { City, Road, Order, Truck, GameState } from './types';

const CARGO_TYPES = [
  '食料品', '電子機器', '自動車部品', '医薬品', '衣料品',
  '化学製品', '鉄鋼', '農産物', '家電製品', '建材',
];

let _orderId = 0;
let _truckId = 0;

export function nextOrderId(): string {
  return `order-${++_orderId}`;
}

export function nextTruckId(): string {
  return `truck-${++_truckId}`;
}

export const INITIAL_CITIES: City[] = [
  { id: 'tokyo',    name: '東京',   x: 720, y: 200, demand: 9, supply: 5 },
  { id: 'osaka',    name: '大阪',   x: 380, y: 300, demand: 8, supply: 6 },
  { id: 'nagoya',   name: '名古屋', x: 540, y: 260, demand: 7, supply: 5 },
  { id: 'sapporo',  name: '札幌',   x: 700, y: 60,  demand: 5, supply: 7 },
  { id: 'fukuoka',  name: '福岡',   x: 160, y: 380, demand: 6, supply: 6 },
  { id: 'sendai',   name: '仙台',   x: 680, y: 150, demand: 5, supply: 5 },
  { id: 'hiroshima',name: '広島',   x: 260, y: 330, demand: 5, supply: 5 },
  { id: 'kanazawa', name: '金沢',   x: 460, y: 220, demand: 4, supply: 5 },
  { id: 'niigata',  name: '新潟',   x: 580, y: 160, demand: 4, supply: 6 },
  { id: 'matsuyama',name: '松山',   x: 310, y: 360, demand: 4, supply: 4 },
];

export const INITIAL_ROADS: Road[] = [
  { id: 'r1',  fromId: 'tokyo',    toId: 'sendai',    distance: 350 },
  { id: 'r2',  fromId: 'sendai',   toId: 'sapporo',   distance: 640 },
  { id: 'r3',  fromId: 'tokyo',    toId: 'nagoya',    distance: 360 },
  { id: 'r4',  fromId: 'tokyo',    toId: 'niigata',   distance: 320 },
  { id: 'r5',  fromId: 'niigata',  toId: 'kanazawa',  distance: 280 },
  { id: 'r6',  fromId: 'nagoya',   toId: 'osaka',     distance: 190 },
  { id: 'r7',  fromId: 'nagoya',   toId: 'kanazawa',  distance: 210 },
  { id: 'r8',  fromId: 'osaka',    toId: 'hiroshima', distance: 340 },
  { id: 'r9',  fromId: 'osaka',    toId: 'matsuyama', distance: 280 },
  { id: 'r10', fromId: 'hiroshima',toId: 'fukuoka',   distance: 280 },
  { id: 'r11', fromId: 'hiroshima',toId: 'matsuyama', distance: 130 },
  { id: 'r12', fromId: 'sendai',   toId: 'niigata',   distance: 270 },
  { id: 'r13', fromId: 'kanazawa', toId: 'osaka',     distance: 260 },
];

export const TRUCK_COST = 500000;
export const MAINTENANCE_PER_TICK = 50;
export const INITIAL_MONEY = 2000000;
export const ORDER_REWARD_PER_KM = 1200;
export const ORDER_BASE_REWARD = 50000;
export const ORDER_DEADLINE_TICKS = 200;

export function generateOrder(cities: City[], tick: number): Order {
  const fromCities = cities.filter((c) => c.supply > 0);
  const toCities = cities.filter((c) => c.demand > 0);

  // Weight by supply/demand
  const from = weightedRandom(fromCities, (c) => c.supply);
  let to = weightedRandom(toCities, (c) => c.demand);
  while (to.id === from.id) {
    to = weightedRandom(toCities, (c) => c.demand);
  }

  const cargo = CARGO_TYPES[Math.floor(Math.random() * CARGO_TYPES.length)];
  const dist = estimateDistance(from, to);
  const reward = Math.round(ORDER_BASE_REWARD + ORDER_REWARD_PER_KM * (dist / 100));
  const deadline = tick + ORDER_DEADLINE_TICKS + Math.floor(Math.random() * 100);

  return {
    id: nextOrderId(),
    fromId: from.id,
    toId: to.id,
    cargo,
    reward,
    penalty: Math.round(reward * 0.005),
    createdAt: tick,
    deadline,
    status: 'pending',
  };
}

function estimateDistance(a: City, b: City): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2) * 2;
}

function weightedRandom<T>(items: T[], weight: (t: T) => number): T {
  const total = items.reduce((s, i) => s + weight(i), 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= weight(item);
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

export function createInitialState(): GameState {
  _orderId = 0;
  _truckId = 0;

  const initialTruck: Truck = {
    id: nextTruckId(),
    name: 'トラック1',
    currentCityId: 'tokyo',
    progress: 0,
    status: 'idle',
    speed: 80,
    capacity: 1,
    purchaseCost: TRUCK_COST,
    maintenanceCostPerTick: MAINTENANCE_PER_TICK,
  };

  const orders: Order[] = [];
  for (let i = 0; i < 5; i++) {
    orders.push(generateOrder(INITIAL_CITIES, 0));
  }

  return {
    tick: 0,
    money: INITIAL_MONEY,
    score: 0,
    cities: INITIAL_CITIES,
    roads: INITIAL_ROADS,
    trucks: [initialTruck],
    orders,
    deliveredCount: 0,
    expiredCount: 0,
    paused: false,
    speed: 1,
    log: ['物流シミュレーションを開始しました！', '最初のトラックが東京に待機中です。'],
  };
}

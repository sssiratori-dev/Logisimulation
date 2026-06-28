export interface City {
  id: string;
  name: string;
  x: number;
  y: number;
  demand: number; // 0-10, how often orders appear here as destination
  supply: number; // 0-10, how often orders appear here as origin
}

export interface Road {
  id: string;
  fromId: string;
  toId: string;
  distance: number; // km
}

export interface Order {
  id: string;
  fromId: string;
  toId: string;
  cargo: string;
  reward: number;
  penalty: number; // per tick overdue
  createdAt: number; // game tick
  deadline: number; // game tick
  assignedTruckId?: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'expired';
}

export type TruckStatus = 'idle' | 'moving' | 'loading' | 'unloading';

export interface Truck {
  id: string;
  name: string;
  currentCityId: string;
  targetCityId?: string;
  progress: number; // 0-1, progress along current road
  status: TruckStatus;
  assignedOrderId?: string;
  routePath?: string[]; // city IDs to traverse
  speed: number; // km per tick
  capacity: number;
  purchaseCost: number;
  maintenanceCostPerTick: number;
}

export interface GameState {
  tick: number;
  money: number;
  score: number;
  cities: City[];
  roads: Road[];
  trucks: Truck[];
  orders: Order[];
  deliveredCount: number;
  expiredCount: number;
  paused: boolean;
  speed: number; // 1=normal, 2=fast, 4=very fast
  selectedTruckId?: string;
  selectedOrderId?: string;
  log: string[];
}

export interface PathResult {
  path: string[];
  totalDistance: number;
}

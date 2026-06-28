// ── Resource system ────────────────────────────────────────────────────────

export type ResourceType = 'food' | 'iron' | 'book' | 'monster_parts';

/** The four resource categories every city holds. */
export interface ResourceStock {
  food: number;
  iron: number;
  book: number;
  monster_parts: number;
}

export type TerrainType = 'mountain' | 'highway' | 'plains';

/** Loss factor per terrain type (fraction that *survives* the trip). */
export const TERRAIN_FACTORS: Record<TerrainType, number> = {
  mountain: 0.5,
  plains: 0.8,
  highway: 0.9,
};

// ── Map entities ───────────────────────────────────────────────────────────

export interface City {
  id: string;
  name: string;
  x: number;
  y: number;
  demand: number; // 0-10, how often orders appear here as destination
  supply: number; // 0-10, how often orders appear here as origin
  population: number;
  resources: ResourceStock;
}

export interface Road {
  id: string;
  fromId: string;
  toId: string;
  distance: number; // km
  terrain: TerrainType;
}

// ── Wagon transport ────────────────────────────────────────────────────────

/** A player-issued resource transport command. */
export interface WagonOrder {
  id: string;
  fromId: string;
  toId: string;
  items: Partial<ResourceStock>;
  unit: 'wagon';
  terrain: TerrainType;
  departTick: number;
  arriveTick: number;
  /** Resources that were lost in transit due to terrain. */
  lostItems: Partial<ResourceStock>;
  status: 'in_transit' | 'arrived';
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
  wagonOrders: WagonOrder[];
  deliveredCount: number;
  expiredCount: number;
  paused: boolean;
  speed: number; // 1=normal, 2=fast, 4=very fast
  selectedTruckId?: string;
  selectedOrderId?: string;
  /** Accumulated resource loss from wagon transit — causes chaos when high. */
  corruption: number;
  chaosActive: boolean;
  log: string[];
}

export interface PathResult {
  path: string[];
  totalDistance: number;
}

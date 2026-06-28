import type { GameState } from '../game/types';

interface Props {
  state: GameState;
  onSelectTruck: (id: string) => void;
  onBuyTruck: (cityId: string) => void;
}

const STATUS_COLOR: Record<string, string> = {
  idle: '#60a5fa',
  moving: '#34d399',
  loading: '#fbbf24',
  unloading: '#f87171',
};

const STATUS_LABEL: Record<string, string> = {
  idle: '待機中',
  moving: '移動中',
  loading: '積荷中',
  unloading: '荷降ろし中',
};

export function TruckPanel({ state, onSelectTruck, onBuyTruck }: Props) {
  const canAfford = state.money >= 500000;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>
        {state.trucks.length} 台のトラック
      </div>

      {state.trucks.map((truck) => {
        const currentCity = state.cities.find((c) => c.id === truck.currentCityId);
        const targetCity = truck.targetCityId
          ? state.cities.find((c) => c.id === truck.targetCityId)
          : null;
        const assignedOrder = truck.assignedOrderId
          ? state.orders.find((o) => o.id === truck.assignedOrderId)
          : null;
        const isSelected = state.selectedTruckId === truck.id;

        return (
          <div
            key={truck.id}
            onClick={() => onSelectTruck(truck.id)}
            style={{
              background: isSelected ? 'rgba(96,165,250,0.2)' : 'rgba(30,41,59,0.8)',
              border: `1px solid ${isSelected ? '#60a5fa' : '#334155'}`,
              borderRadius: '6px',
              padding: '8px 10px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', color: '#f1f5f9', fontSize: '13px' }}>
                🚛 {truck.name}
              </span>
              <span
                style={{
                  color: STATUS_COLOR[truck.status],
                  fontSize: '11px',
                  fontWeight: 'bold',
                  background: `${STATUS_COLOR[truck.status]}20`,
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                {STATUS_LABEL[truck.status]}
              </span>
            </div>

            <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>
              📍 {currentCity?.name}
              {targetCity && ` → ${targetCity.name}`}
            </div>

            {truck.status === 'moving' && (
              <div style={{ marginTop: '4px' }}>
                <div
                  style={{
                    background: '#1e293b',
                    borderRadius: '3px',
                    height: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${truck.progress * 100}%`,
                      height: '100%',
                      background: '#34d399',
                      transition: 'width 0.1s',
                    }}
                  />
                </div>
              </div>
            )}

            {assignedOrder && (
              <div style={{ color: '#60a5fa', fontSize: '10px', marginTop: '3px' }}>
                📦 {assignedOrder.cargo}
              </div>
            )}
          </div>
        );
      })}

      {/* Buy truck button */}
      <button
        onClick={() => {
          const idleCity = state.trucks.find((t) => t.status === 'idle')?.currentCityId ?? 'tokyo';
          onBuyTruck(idleCity);
        }}
        disabled={!canAfford}
        style={{
          marginTop: '8px',
          padding: '8px',
          background: canAfford ? '#1d4ed8' : '#1e293b',
          border: `1px solid ${canAfford ? '#3b82f6' : '#334155'}`,
          borderRadius: '6px',
          color: canAfford ? '#bfdbfe' : '#475569',
          cursor: canAfford ? 'pointer' : 'not-allowed',
          fontSize: '12px',
          fontWeight: 'bold',
        }}
      >
        🛒 新しいトラックを購入 (¥500,000)
      </button>
    </div>
  );
}

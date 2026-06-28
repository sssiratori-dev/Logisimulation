import type { GameState, Order } from '../game/types';

interface Props {
  state: GameState;
  onSelectOrder: (id: string) => void;
  onAssign: (truckId: string, orderId: string) => void;
}

const STATUS_LABEL: Record<string, string> = {
  pending: '⏳ 待機中',
  in_transit: '🚚 配送中',
  delivered: '✅ 完了',
  expired: '❌ 期限切れ',
};

const STATUS_COLOR: Record<string, string> = {
  pending: '#fbbf24',
  in_transit: '#34d399',
  delivered: '#60a5fa',
  expired: '#f87171',
};

function urgencyColor(order: Order, tick: number): string {
  if (order.status !== 'pending') return 'transparent';
  const remaining = order.deadline - tick;
  if (remaining < 50) return 'rgba(248,113,113,0.15)';
  if (remaining < 100) return 'rgba(251,191,36,0.15)';
  return 'transparent';
}

export function OrderPanel({ state, onSelectOrder, onAssign }: Props) {
  const activeOrders = state.orders.filter((o) => o.status === 'pending' || o.status === 'in_transit');
  const selectedTruck = state.trucks.find((t) => t.id === state.selectedTruckId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>
        {activeOrders.length} 件のアクティブな注文
        {selectedTruck && (
          <span style={{ color: '#60a5fa', marginLeft: '8px' }}>
            （{selectedTruck.name} を選択中 — クリックで割り当て）
          </span>
        )}
      </div>
      {activeOrders.map((order) => {
        const fromCity = state.cities.find((c) => c.id === order.fromId);
        const toCity = state.cities.find((c) => c.id === order.toId);
        const remaining = order.deadline - state.tick;
        const canAssign =
          selectedTruck &&
          selectedTruck.status === 'idle' &&
          order.status === 'pending';
        const isSelected = state.selectedOrderId === order.id;

        return (
          <div
            key={order.id}
            onClick={() => {
              if (canAssign && selectedTruck) {
                onAssign(selectedTruck.id, order.id);
              } else {
                onSelectOrder(order.id);
              }
            }}
            style={{
              background: isSelected ? 'rgba(245,158,11,0.2)' : urgencyColor(order, state.tick),
              border: `1px solid ${isSelected ? '#f59e0b' : canAssign ? '#34d399' : '#334155'}`,
              borderRadius: '6px',
              padding: '8px 10px',
              cursor: canAssign ? 'pointer' : 'default',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', color: '#f1f5f9', fontSize: '13px' }}>
                {order.cargo}
              </span>
              <span
                style={{
                  color: STATUS_COLOR[order.status],
                  fontSize: '11px',
                  fontWeight: 'bold',
                }}
              >
                {STATUS_LABEL[order.status]}
              </span>
            </div>
            <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '3px' }}>
              {fromCity?.name} → {toCity?.name}
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '4px',
                fontSize: '11px',
              }}
            >
              <span style={{ color: '#34d399' }}>¥{order.reward.toLocaleString()}</span>
              <span
                style={{
                  color: remaining < 50 ? '#f87171' : remaining < 100 ? '#fbbf24' : '#64748b',
                }}
              >
                残り {remaining} tick
              </span>
            </div>
            {order.assignedTruckId && (
              <div style={{ color: '#60a5fa', fontSize: '10px', marginTop: '2px' }}>
                {state.trucks.find((t) => t.id === order.assignedTruckId)?.name}
              </div>
            )}
          </div>
        );
      })}
      {activeOrders.length === 0 && (
        <div style={{ color: '#475569', fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>
          注文がありません
        </div>
      )}
    </div>
  );
}

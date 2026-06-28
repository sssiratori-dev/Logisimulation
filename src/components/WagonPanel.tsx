import { useState } from 'react';
import type { GameState, ResourceType } from '../game/types';
import { TERRAIN_FACTORS } from '../game/types';
import { RESOURCE_LABELS } from '../game/resourceEngine';
import { getRoadBetween } from '../game/pathfinding';
import { WAGON_TICKS_PER_100KM } from '../game/initialData';

interface Props {
  state: GameState;
  onIssueOrder: (fromId: string, toId: string, items: Record<string, number>) => void;
}

const TERRAIN_COLOR: Record<string, string> = {
  mountain: '#f87171',
  plains: '#fbbf24',
  highway: '#34d399',
};

const TERRAIN_LABEL: Record<string, string> = {
  mountain: '⛰ 山岳',
  plains: '🌾 平地',
  highway: '🛣 街道',
};

export function WagonPanel({ state, onIssueOrder }: Props) {
  const [fromId, setFromId] = useState(state.cities[0]?.id ?? '');
  const [toId, setToId] = useState(state.cities[1]?.id ?? '');
  const [amounts, setAmounts] = useState<Record<ResourceType, number>>({
    food: 0,
    iron: 0,
    book: 0,
    monster_parts: 0,
  });

  const road = getRoadBetween(fromId, toId, state.roads);
  const fromCity = state.cities.find((c) => c.id === fromId);

  const hasItems = Object.values(amounts).some((v) => v > 0);

  const handleIssue = () => {
    if (!hasItems || !road) return;
    onIssueOrder(fromId, toId, amounts);
    setAmounts({ food: 0, iron: 0, book: 0, monster_parts: 0 });
  };

  // Active wagon orders
  const activeWagons = state.wagonOrders.filter((w) => w.status === 'in_transit');

  const selectStyle = {
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '4px',
    color: '#f1f5f9',
    padding: '4px 6px',
    fontSize: '12px',
    width: '100%',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Issue form */}
      <div
        style={{
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '6px',
          padding: '10px',
        }}
      >
        <div style={{ fontWeight: 'bold', color: '#f1f5f9', fontSize: '13px', marginBottom: '8px' }}>
          🐴 輸送命令を発行
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
          <div>
            <div style={{ color: '#64748b', fontSize: '10px', marginBottom: '3px' }}>出発地</div>
            <select value={fromId} onChange={(e) => setFromId(e.target.value)} style={selectStyle as React.CSSProperties}>
              {state.cities.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '10px', marginBottom: '3px' }}>目的地</div>
            <select value={toId} onChange={(e) => setToId(e.target.value)} style={selectStyle as React.CSSProperties}>
              {state.cities.filter((c) => c.id !== fromId).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Road info */}
        {road ? (
          <div
            style={{
              background: '#0f172a',
              borderRadius: '4px',
              padding: '5px 8px',
              marginBottom: '8px',
              fontSize: '11px',
              color: TERRAIN_COLOR[road.terrain],
            }}
          >
            {TERRAIN_LABEL[road.terrain]} — {road.distance}km — 到着まで約{' '}
        {Math.ceil((road.distance / 100) * WAGON_TICKS_PER_100KM)} tick
          </div>
        ) : (
          <div
            style={{
              background: '#0f172a',
              borderRadius: '4px',
              padding: '5px 8px',
              marginBottom: '8px',
              fontSize: '11px',
              color: '#f87171',
            }}
          >
            ⚠️ 直通道路なし（経由地が必要です）
          </div>
        )}

        {/* Resource amount inputs */}
        {(Object.keys(RESOURCE_LABELS) as ResourceType[]).map((key) => {
          const available = fromCity?.resources[key] ?? 0;
          return (
            <div
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '5px',
                fontSize: '12px',
              }}
            >
              <span style={{ color: '#94a3b8', flex: 1 }}>{RESOURCE_LABELS[key]}</span>
              <span style={{ color: '#475569', fontSize: '10px', minWidth: '50px' }}>
                在庫: {Math.floor(available)}
              </span>
              <input
                type="number"
                min={0}
                max={Math.floor(available)}
                value={amounts[key] || ''}
                onChange={(e) =>
                  setAmounts((prev) => ({
                    ...prev,
                    [key]: Math.min(Math.floor(available), Math.max(0, Number(e.target.value) || 0)),
                  }))
                }
                style={{
                  width: '64px',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '4px',
                  color: '#f1f5f9',
                  padding: '3px 5px',
                  fontSize: '12px',
                  textAlign: 'right',
                }}
              />
            </div>
          );
        })}

        {/* Loss preview */}
        {road && hasItems && (
          <div
            style={{
              background: '#0f172a',
              borderRadius: '4px',
              padding: '5px 8px',
              marginBottom: '8px',
              fontSize: '11px',
            }}
          >
            <div style={{ color: '#64748b', marginBottom: '3px' }}>損失予測（地形係数）</div>
            {(Object.keys(RESOURCE_LABELS) as ResourceType[]).map((key) => {
              const amt = amounts[key];
              if (!amt) return null;
              const factor = TERRAIN_FACTORS[road.terrain];
              const lost = Math.floor(amt * (1 - factor));
              const arrives = amt - lost;
              return (
                <div key={key} style={{ color: '#94a3b8' }}>
                  {RESOURCE_LABELS[key]}: {amt} → {arrives}{' '}
                  <span style={{ color: '#f87171' }}>(-{lost})</span>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={handleIssue}
          disabled={!hasItems || !road}
          style={{
            width: '100%',
            padding: '7px',
            background: hasItems && road ? '#166534' : '#1e293b',
            border: `1px solid ${hasItems && road ? '#16a34a' : '#334155'}`,
            borderRadius: '5px',
            color: hasItems && road ? '#bbf7d0' : '#475569',
            cursor: hasItems && road ? 'pointer' : 'not-allowed',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
        >
          🐴 輸送命令を発行
        </button>
      </div>

      {/* In-transit wagons */}
      <div>
        <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '5px' }}>
          輸送中の荷馬車 ({activeWagons.length})
        </div>
        {activeWagons.map((wo) => {
          const from = state.cities.find((c) => c.id === wo.fromId);
          const to = state.cities.find((c) => c.id === wo.toId);
          const progress = Math.min(
            100,
            Math.floor(((state.tick - wo.departTick) / (wo.arriveTick - wo.departTick)) * 100)
          );
          const itemSummary = Object.entries(wo.items)
            .filter(([, v]) => v)
            .map(([k, v]) => `${RESOURCE_LABELS[k as ResourceType]} ${v}`)
            .join(', ');

          return (
            <div
              key={wo.id}
              style={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '5px',
                padding: '7px 9px',
                marginBottom: '5px',
              }}
            >
              <div style={{ fontSize: '11px', color: '#f1f5f9', marginBottom: '3px' }}>
                {from?.name} → {to?.name}
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
                {itemSummary}
              </div>
              <div
                style={{
                  background: '#0f172a',
                  borderRadius: '3px',
                  height: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: '100%',
                    background: TERRAIN_COLOR[wo.terrain] ?? '#60a5fa',
                    transition: 'width 0.3s',
                  }}
                />
              </div>
              <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px', textAlign: 'right' }}>
                残り {Math.max(0, wo.arriveTick - state.tick)} tick
              </div>
            </div>
          );
        })}
        {activeWagons.length === 0 && (
          <div style={{ color: '#475569', fontSize: '11px', textAlign: 'center', padding: '10px 0' }}>
            輸送中の荷馬車はありません
          </div>
        )}
      </div>
    </div>
  );
}

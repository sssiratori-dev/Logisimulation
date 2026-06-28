import type { GameState } from '../game/types';
import { RESOURCE_LABELS } from '../game/resourceEngine';
import { CORRUPTION_THRESHOLD, RESOURCE_TURN_INTERVAL } from '../game/initialData';
import { getRoadBetween } from '../game/pathfinding';
import { TERRAIN_FACTORS } from '../game/types';

interface Props {
  state: GameState;
  onQuickTransport: () => void;
}

const TERRAIN_LABEL: Record<string, string> = {
  mountain: '⛰ 山岳 (×0.5)',
  plains: '🌾 平地 (×0.8)',
  highway: '🛣 街道 (×0.9)',
};

const QUICK_TRANSPORT = {
  fromLabel: '拠点A',
  fromId: 'sapporo',
  toLabel: '拠点B',
  toId: 'sendai',
  amount: 120,
};

export function ResourcePanel({ state, onQuickTransport }: Props) {
  const corruptionPct = Math.min(100, (state.corruption / CORRUPTION_THRESHOLD) * 100);
  const corruptionColor =
    corruptionPct >= 100 ? '#f87171' : corruptionPct >= 70 ? '#fbbf24' : '#34d399';
  const sourceCity = state.cities.find((city) => city.id === QUICK_TRANSPORT.fromId);
  const destinationCity = state.cities.find((city) => city.id === QUICK_TRANSPORT.toId);
  const quickRoad = getRoadBetween(QUICK_TRANSPORT.fromId, QUICK_TRANSPORT.toId, state.roads);
  const quickFactor = quickRoad ? TERRAIN_FACTORS[quickRoad.terrain] : 0;
  const quickLost = Math.floor(QUICK_TRANSPORT.amount * (1 - quickFactor));
  const quickArrives = QUICK_TRANSPORT.amount - quickLost;
  const resourceTurnRemainder = state.tick % RESOURCE_TURN_INTERVAL;
  const ticksUntilConsumption =
    (RESOURCE_TURN_INTERVAL - resourceTurnRemainder) || RESOURCE_TURN_INTERVAL;
  const activeQuickTransports = state.wagonOrders.filter(
    (wagon) =>
      wagon.status === 'in_transit' &&
      wagon.fromId === QUICK_TRANSPORT.fromId &&
      wagon.toId === QUICK_TRANSPORT.toId &&
      wagon.items.food === QUICK_TRANSPORT.amount
  ).length;
  const canQuickTransport = (sourceCity?.resources.food ?? 0) >= QUICK_TRANSPORT.amount && Boolean(quickRoad);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div
        style={{
          background: '#1e293b',
          border: '1px solid #3b82f6',
          borderRadius: '6px',
          padding: '10px',
        }}
      >
        <div style={{ color: '#bfdbfe', fontWeight: 'bold', fontSize: '13px', marginBottom: '6px' }}>
          🎯 資源輸送プロトタイプ
        </div>
        <div style={{ color: '#94a3b8', fontSize: '11px', lineHeight: 1.5, marginBottom: '8px' }}>
          {QUICK_TRANSPORT.fromLabel}={sourceCity?.name ?? QUICK_TRANSPORT.fromId} から {QUICK_TRANSPORT.toLabel}=
          {destinationCity?.name ?? QUICK_TRANSPORT.toId} へ 🌾 食料 {QUICK_TRANSPORT.amount} を一括輸送します。
          クリック後は出発地の在庫が即時に減り、到着時にロス込みで目的地へ反映されます。
        </div>
        {quickRoad && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: '4px 12px',
              fontSize: '11px',
              color: '#cbd5e1',
              marginBottom: '8px',
            }}
          >
            <div>地形: {TERRAIN_LABEL[quickRoad.terrain]}</div>
            <div>距離: {quickRoad.distance}km</div>
            <div>到着量: {quickArrives}</div>
            <div>輸送ロス: {quickLost}</div>
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={onQuickTransport}
            disabled={!canQuickTransport}
            style={{
              padding: '7px 10px',
              background: canQuickTransport ? '#1d4ed8' : '#0f172a',
              border: `1px solid ${canQuickTransport ? '#3b82f6' : '#334155'}`,
              borderRadius: '5px',
              color: canQuickTransport ? '#dbeafe' : '#64748b',
              cursor: canQuickTransport ? 'pointer' : 'not-allowed',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            🌾 {QUICK_TRANSPORT.fromLabel}→{QUICK_TRANSPORT.toLabel}へ食料を輸送
          </button>
          <span style={{ color: '#64748b', fontSize: '11px' }}>
            次の食料消費まで {ticksUntilConsumption} tick
          </span>
          {activeQuickTransports > 0 && (
            <span style={{ color: '#fbbf24', fontSize: '11px' }}>
              輸送中 {activeQuickTransports} 件
            </span>
          )}
        </div>
      </div>

      {/* Corruption meter */}
      <div
        style={{
          background: '#1e293b',
          border: `1px solid ${corruptionColor}`,
          borderRadius: '6px',
          padding: '8px 10px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            marginBottom: '5px',
          }}
        >
          <span style={{ fontWeight: 'bold', color: corruptionColor }}>
            💀 腐敗値 (Corruption)
          </span>
          <span style={{ color: corruptionColor }}>
            {Math.floor(state.corruption)} / {CORRUPTION_THRESHOLD}
          </span>
        </div>
        <div style={{ background: '#0f172a', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${corruptionPct}%`,
              height: '100%',
              background: corruptionColor,
              transition: 'width 0.3s',
            }}
          />
        </div>
        {state.chaosActive && (
          <div style={{ color: '#f87171', fontSize: '11px', marginTop: '5px', fontWeight: 'bold' }}>
            🔥 カオスイベント発生中！
          </div>
        )}
      </div>

      {/* City resource grid */}
      {state.cities.map((city) => (
        <div
          key={city.id}
          style={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '6px',
            padding: '8px 10px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '6px',
              alignItems: 'center',
            }}
          >
            <span style={{ fontWeight: 'bold', color: '#f1f5f9', fontSize: '13px' }}>
              🏙 {city.name}
            </span>
            <span style={{ color: '#94a3b8', fontSize: '11px' }}>
              👥 人口 {city.population.toLocaleString()}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 12px' }}>
            {(Object.keys(RESOURCE_LABELS) as (keyof typeof RESOURCE_LABELS)[]).map((key) => {
              const val = city.resources[key];
              const isLow = key === 'food' && val < city.population * 0.1;
              return (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: isLow ? '#f87171' : '#94a3b8',
                  }}
                >
                  <span>{RESOURCE_LABELS[key]}</span>
                  <span style={{ fontWeight: 'bold', color: isLow ? '#f87171' : '#e2e8f0' }}>
                    {Math.floor(val)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Food consumption forecast */}
          <div style={{ marginTop: '5px', fontSize: '10px', color: '#475569' }}>
            消費予測: {Math.floor(city.population * 0.05)}/ターン ・ 次回消費まで {ticksUntilConsumption} tick
          </div>
        </div>
      ))}

      {/* Terrain legend */}
      <div
        style={{
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '6px',
          padding: '8px 10px',
        }}
      >
        <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 'bold', marginBottom: '5px' }}>
          地形係数
        </div>
        {Object.entries(TERRAIN_LABEL).map(([k, v]) => (
          <div key={k} style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>
            {v}
          </div>
        ))}
      </div>
    </div>
  );
}

import type { GameState } from '../game/types';
import { RESOURCE_LABELS } from '../game/resourceEngine';
import { CORRUPTION_THRESHOLD } from '../game/initialData';

interface Props {
  state: GameState;
}

const TERRAIN_LABEL: Record<string, string> = {
  mountain: '⛰ 山岳 (×0.5)',
  plains: '🌾 平地 (×0.8)',
  highway: '🛣 街道 (×0.9)',
};

export function ResourcePanel({ state }: Props) {
  const corruptionPct = Math.min(100, (state.corruption / CORRUPTION_THRESHOLD) * 100);
  const corruptionColor =
    corruptionPct >= 100 ? '#f87171' : corruptionPct >= 70 ? '#fbbf24' : '#34d399';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
            消費予測: {Math.floor(city.population * 0.05)}/ターン
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

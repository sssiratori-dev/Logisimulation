import type { GameState } from '../game/types';

interface Props {
  state: GameState;
  onTogglePause: () => void;
  onSetSpeed: (speed: number) => void;
  onReset: () => void;
}

export function HUD({ state, onTogglePause, onSetSpeed, onReset }: Props) {
  const speeds = [1, 2, 4, 8];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(15,23,42,0.95)',
        borderBottom: '1px solid #334155',
        padding: '10px 16px',
        flexWrap: 'wrap',
        gap: '8px',
      }}
    >
      {/* Title */}
      <div style={{ fontWeight: 'bold', color: '#f1f5f9', fontSize: '16px' }}>
        🏭 物流シミュレーション
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <Stat label="💰 資金" value={`¥${state.money.toLocaleString()}`} color={state.money < 0 ? '#f87171' : '#34d399'} />
        <Stat label="🏆 スコア" value={state.score.toLocaleString()} color="#fbbf24" />
        <Stat label="✅ 配送完了" value={state.deliveredCount.toString()} color="#60a5fa" />
        <Stat label="❌ 期限切れ" value={state.expiredCount.toString()} color="#f87171" />
        <Stat label="⏱ Tick" value={state.tick.toString()} color="#94a3b8" />
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {/* Speed buttons */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => onSetSpeed(s)}
              style={{
                padding: '4px 8px',
                background: state.speed === s ? '#1d4ed8' : '#1e293b',
                border: `1px solid ${state.speed === s ? '#3b82f6' : '#334155'}`,
                borderRadius: '4px',
                color: state.speed === s ? '#bfdbfe' : '#64748b',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 'bold',
              }}
            >
              {s}×
            </button>
          ))}
        </div>

        <button
          onClick={onTogglePause}
          style={{
            padding: '4px 12px',
            background: state.paused ? '#166534' : '#7c3aed',
            border: `1px solid ${state.paused ? '#16a34a' : '#7c3aed'}`,
            borderRadius: '4px',
            color: '#f1f5f9',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
            minWidth: '70px',
          }}
        >
          {state.paused ? '▶ 再開' : '⏸ 一時停止'}
        </button>

        <button
          onClick={onReset}
          style={{
            padding: '4px 10px',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '4px',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          🔄 リセット
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ color: '#64748b', fontSize: '10px' }}>{label}</div>
      <div style={{ color, fontSize: '14px', fontWeight: 'bold' }}>{value}</div>
    </div>
  );
}

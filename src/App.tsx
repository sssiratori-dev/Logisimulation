import { useState } from 'react';
import { useGameLoop } from './hooks/useGameLoop';
import { GameMap } from './components/GameMap';
import { HUD } from './components/HUD';
import { TruckPanel } from './components/TruckPanel';
import { OrderPanel } from './components/OrderPanel';
import { LogPanel } from './components/LogPanel';
import './App.css';

type Tab = 'trucks' | 'orders' | 'log';

function App() {
  const { state, togglePause, setSpeed, selectTruck, selectOrder, assignOrder, purchaseTruck, resetGame } =
    useGameLoop();
  const [activeTab, setActiveTab] = useState<Tab>('trucks');

  const handleCityClick = (_cityId: string) => {
    // City click for future use
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f172a', color: '#f1f5f9', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>
      {/* Top HUD */}
      <HUD state={state} onTogglePause={togglePause} onSetSpeed={setSpeed} onReset={resetGame} />

      {/* Main content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Map area */}
        <div style={{ flex: 1, padding: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              flex: 1,
              border: '1px solid #334155',
              borderRadius: '8px',
              overflow: 'hidden',
              background: '#0f172a',
            }}
          >
            <GameMap state={state} onCityClick={handleCityClick} />
          </div>

          {/* How to play */}
          <div style={{ marginTop: '8px', color: '#475569', fontSize: '11px' }}>
            💡 操作方法: トラックを選択 → 注文をクリックして配送を割り当て | 黄色のバッジ = 待機中の注文数
          </div>
        </div>

        {/* Side panel */}
        <div
          style={{
            width: '300px',
            display: 'flex',
            flexDirection: 'column',
            borderLeft: '1px solid #334155',
            overflow: 'hidden',
          }}
        >
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #334155' }}>
            {(['trucks', 'orders', 'log'] as Tab[]).map((tab) => {
              const labels: Record<Tab, string> = { trucks: '🚛 トラック', orders: '📦 注文', log: '📋 ログ' };
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    background: activeTab === tab ? '#1e293b' : 'transparent',
                    border: 'none',
                    borderBottom: activeTab === tab ? '2px solid #60a5fa' : '2px solid transparent',
                    color: activeTab === tab ? '#f1f5f9' : '#64748b',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: activeTab === tab ? 'bold' : 'normal',
                  }}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>

          {/* Panel content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
            {activeTab === 'trucks' && (
              <TruckPanel state={state} onSelectTruck={selectTruck} onBuyTruck={purchaseTruck} />
            )}
            {activeTab === 'orders' && (
              <OrderPanel state={state} onSelectOrder={selectOrder} onAssign={assignOrder} />
            )}
            {activeTab === 'log' && <LogPanel log={state.log} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

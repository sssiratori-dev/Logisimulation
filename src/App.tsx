import { useState } from 'react';
import { useGameLoop } from './hooks/useGameLoop';
import { GameMap } from './components/GameMap';
import { HUD } from './components/HUD';
import { TruckPanel } from './components/TruckPanel';
import { OrderPanel } from './components/OrderPanel';
import { ResourcePanel } from './components/ResourcePanel';
import { WagonPanel } from './components/WagonPanel';
import { LogPanel } from './components/LogPanel';
import type { ResourceStock } from './game/types';
import './App.css';

type Tab = 'trucks' | 'orders' | 'resources' | 'wagon' | 'log';

const TAB_LABELS: Record<Tab, string> = {
  trucks: '🚛 トラック',
  orders: '📦 注文',
  resources: '🏙 資源',
  wagon: '🐴 輸送',
  log: '📋 ログ',
};

function App() {
  const { state, togglePause, setSpeed, selectTruck, selectOrder, assignOrder, purchaseTruck, issueWagon, resetGame } =
    useGameLoop();
  const [activeTab, setActiveTab] = useState<Tab>('resources');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f172a', color: '#f1f5f9', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>
      <HUD state={state} onTogglePause={togglePause} onSetSpeed={setSpeed} onReset={resetGame} />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Map */}
        <div style={{ flex: 1, padding: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, border: '1px solid #334155', borderRadius: '8px', overflow: 'hidden', background: '#0f172a' }}>
            <GameMap state={state} onCityClick={(_cityId: string) => {}} />
          </div>
          <div style={{ marginTop: '8px', color: '#475569', fontSize: '11px' }}>
            💡 操作方法: [トラック] タブでトラック選択 → [注文] で割り当て | [資源] で都市ストック確認 | [輸送] で荷馬車命令
          </div>
        </div>

        {/* Side panel */}
        <div style={{ width: '320px', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #334155', overflow: 'hidden' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #334155', overflowX: 'auto' }}>
            {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: '0 0 auto',
                  padding: '8px 6px',
                  background: activeTab === tab ? '#1e293b' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid #60a5fa' : '2px solid transparent',
                  color: activeTab === tab ? '#f1f5f9' : '#64748b',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: activeTab === tab ? 'bold' : 'normal',
                  whiteSpace: 'nowrap',
                }}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
            {activeTab === 'trucks' && (
              <TruckPanel state={state} onSelectTruck={selectTruck} onBuyTruck={purchaseTruck} />
            )}
            {activeTab === 'orders' && (
              <OrderPanel state={state} onSelectOrder={selectOrder} onAssign={assignOrder} />
            )}
            {activeTab === 'resources' && <ResourcePanel state={state} />}
            {activeTab === 'wagon' && (
              <WagonPanel
                state={state}
                onIssueOrder={(from, to, items) =>
                  issueWagon(from, to, items as Partial<ResourceStock>)
                }
              />
            )}
            {activeTab === 'log' && <LogPanel log={state.log} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

import { useEffect, useRef } from 'react';
import type { GameState } from '../game/types';

interface Props {
  state: GameState;
  onCityClick: (cityId: string) => void;
}

const MAP_WIDTH = 800;
const MAP_HEIGHT = 440;
const CITY_RADIUS = 18;

const STATUS_COLORS: Record<string, string> = {
  idle: '#60a5fa',
  moving: '#34d399',
  loading: '#fbbf24',
  unloading: '#f87171',
};

export function GameMap({ state, onCityClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Sync canvas internal resolution to its CSS display size so it fills the container
    const displayW = canvas.offsetWidth || MAP_WIDTH;
    const displayH = canvas.offsetHeight || MAP_HEIGHT;
    canvas.width = displayW;
    canvas.height = displayH;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Scale the drawing context so all coordinates remain in MAP_WIDTH × MAP_HEIGHT space
    ctx.setTransform(displayW / MAP_WIDTH, 0, 0, displayH / MAP_HEIGHT, 0, 0);

    // Clear
    ctx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // Background
    const bg = ctx.createLinearGradient(0, 0, MAP_WIDTH, MAP_HEIGHT);
    bg.addColorStop(0, '#0f172a');
    bg.addColorStop(1, '#1e293b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // Draw roads
    for (const road of state.roads) {
      const from = state.cities.find((c) => c.id === road.fromId);
      const to = state.cities.find((c) => c.id === road.toId);
      if (!from || !to) continue;

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.stroke();

      // Distance label
      const mx = (from.x + to.x) / 2;
      const my = (from.y + to.y) / 2;
      ctx.fillStyle = '#64748b';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${road.distance}km`, mx, my - 4);
    }

    // Draw trucks on roads
    for (const truck of state.trucks) {
      if (truck.status !== 'moving' || !truck.targetCityId) continue;
      const from = state.cities.find((c) => c.id === truck.currentCityId);
      const to = state.cities.find((c) => c.id === truck.targetCityId);
      if (!from || !to) continue;

      const tx = from.x + (to.x - from.x) * truck.progress;
      const ty = from.y + (to.y - from.y) * truck.progress;

      // Glow effect
      ctx.shadowColor = STATUS_COLORS[truck.status] || '#60a5fa';
      ctx.shadowBlur = 12;

      // Truck icon (circle with direction arrow)
      ctx.beginPath();
      ctx.arc(tx, ty, 10, 0, Math.PI * 2);
      ctx.fillStyle = STATUS_COLORS[truck.status] || '#60a5fa';
      ctx.fill();

      // Truck label
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🚚', tx, ty);
    }
    ctx.shadowBlur = 0;

    // Draw cities
    for (const city of state.cities) {
      const isSelected =
        state.selectedTruckId &&
        state.trucks.find((t) => t.id === state.selectedTruckId)?.currentCityId === city.id;
      const hasIdleTruck = state.trucks.some(
        (t) => t.currentCityId === city.id && t.status === 'idle'
      );
      const hasOrder = state.orders.some(
        (o) => (o.fromId === city.id || o.toId === city.id) && o.status === 'pending'
      );

      // Shadow/glow for cities with orders
      if (hasOrder) {
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 15;
      }

      // Outer ring
      ctx.beginPath();
      ctx.arc(city.x, city.y, CITY_RADIUS + 2, 0, Math.PI * 2);
      ctx.strokeStyle = isSelected ? '#f59e0b' : hasIdleTruck ? '#60a5fa' : '#475569';
      ctx.lineWidth = 2;
      ctx.stroke();

      // City circle
      ctx.beginPath();
      ctx.arc(city.x, city.y, CITY_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#92400e' : hasIdleTruck ? '#1e3a5f' : '#1e293b';
      ctx.fill();
      ctx.shadowBlur = 0;

      // City name
      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(city.name, city.x, city.y);

      // Pending order indicator
      const pendingCount = state.orders.filter(
        (o) => o.fromId === city.id && o.status === 'pending'
      ).length;
      if (pendingCount > 0) {
        ctx.beginPath();
        ctx.arc(city.x + CITY_RADIUS - 2, city.y - CITY_RADIUS + 2, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(pendingCount), city.x + CITY_RADIUS - 2, city.y - CITY_RADIUS + 2);
      }

      // Idle truck indicator
      const idleTrucks = state.trucks.filter(
        (t) => t.currentCityId === city.id && t.status === 'idle'
      );
      if (idleTrucks.length > 0) {
        ctx.fillStyle = '#60a5fa';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('🚛', city.x - CITY_RADIUS + 2, city.y - CITY_RADIUS - 14);
      }
    }

    // Draw selected truck path
    if (state.selectedTruckId) {
      const truck = state.trucks.find((t) => t.id === state.selectedTruckId);
      if (truck?.routePath && truck.routePath.length > 1) {
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < truck.routePath.length; i++) {
          const city = state.cities.find((c) => c.id === truck.routePath![i]);
          if (!city) continue;
          if (i === 0) ctx.moveTo(city.x, city.y);
          else ctx.lineTo(city.x, city.y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }, [state]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scaleX = MAP_WIDTH / rect.width;
    const scaleY = MAP_HEIGHT / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    for (const city of state.cities) {
      const dx = x - city.x;
      const dy = y - city.y;
      if (Math.sqrt(dx * dx + dy * dy) < CITY_RADIUS + 5) {
        onCityClick(city.id);
        return;
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={MAP_WIDTH}
      height={MAP_HEIGHT}
      onClick={handleClick}
      style={{ width: '100%', height: '100%', cursor: 'pointer', borderRadius: '8px', display: 'block' }}
    />
  );
}

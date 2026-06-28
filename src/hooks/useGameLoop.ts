import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameState } from '../game/types';
import { createInitialState } from '../game/initialData';
import { tick, assignOrderToTruck, buyTruck } from '../game/gameEngine';

const TICK_MS = 100; // base tick interval in ms

export function useGameLoop() {
  const [state, setState] = useState<GameState>(createInitialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startLoop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const s = stateRef.current;
      if (!s.paused) {
        // Run multiple ticks per interval based on speed
        let next = s;
        for (let i = 0; i < s.speed; i++) {
          next = tick(next);
        }
        setState(next);
      }
    }, TICK_MS);
  }, []);

  useEffect(() => {
    startLoop();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startLoop]);

  const togglePause = useCallback(() => {
    setState((s) => ({ ...s, paused: !s.paused }));
  }, []);

  const setSpeed = useCallback((speed: number) => {
    setState((s) => ({ ...s, speed }));
  }, []);

  const selectTruck = useCallback((id: string | undefined) => {
    setState((s) => ({ ...s, selectedTruckId: id, selectedOrderId: undefined }));
  }, []);

  const selectOrder = useCallback((id: string | undefined) => {
    setState((s) => ({ ...s, selectedOrderId: id }));
  }, []);

  const assignOrder = useCallback((truckId: string, orderId: string) => {
    setState((s) => assignOrderToTruck(s, truckId, orderId));
  }, []);

  const purchaseTruck = useCallback((cityId: string) => {
    setState((s) => buyTruck(s, cityId));
  }, []);

  const resetGame = useCallback(() => {
    setState(createInitialState());
  }, []);

  return {
    state,
    togglePause,
    setSpeed,
    selectTruck,
    selectOrder,
    assignOrder,
    purchaseTruck,
    resetGame,
  };
}

import { useEffect, useRef, useState } from 'react';
import { api } from './api';
import { createCIFleetLoader, type FleetCar, type FleetState } from './ciFleet';

export function useCIFleet(initial: () => FleetCar[]) {
  const [fleet, setFleet] = useState<FleetState>(() => ({ cars: initial(), source: 'local', loading: false, error: null }));
  const ref = useRef<ReturnType<typeof createCIFleetLoader> | null>(null);
  if (!ref.current) ref.current = createCIFleetLoader(api.getBusesInventory, fleet.cars, setFleet,
    (callback, delay) => window.setTimeout(callback, delay), timer => window.clearTimeout(timer as number));
  const loader = ref.current;
  useEffect(() => {
    loader.activate(); void loader.load();
    const recover = () => loader.recover();
    window.addEventListener('focus', recover);
    window.addEventListener('online', recover);
    return () => { loader.dispose(); window.removeEventListener('focus', recover); window.removeEventListener('online', recover); };
  }, [loader]);
  return { ...fleet, reload: () => loader.load(true) };
}

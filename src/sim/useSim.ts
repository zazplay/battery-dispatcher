import { useSyncExternalStore } from 'react';
import { simStore } from './store';

/** The latest simulation snapshot, refreshed ~16 times a second. */
export const useSim = () => useSyncExternalStore(simStore.subscribe, simStore.getSnapshot, simStore.getSnapshot);

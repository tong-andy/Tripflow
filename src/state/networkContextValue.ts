import { createContext } from 'react';
export interface NetworkContextValue { isOnline: boolean }
export const NetworkContext = createContext<NetworkContextValue>({isOnline:true});

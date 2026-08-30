import { useContext } from 'react';
import { NetworkContext } from './networkContextValue';
export const useNetwork=()=>useContext(NetworkContext);

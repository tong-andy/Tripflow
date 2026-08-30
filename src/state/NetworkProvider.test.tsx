import { act, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { NetworkProvider } from './NetworkProvider';
import { useNetwork } from './useNetwork';
function Probe(){return <span>{useNetwork().isOnline?'在线':'离线'}</span>}
describe('NetworkProvider',()=>{it('reacts to online and offline browser events',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true}));render(<NetworkProvider><Probe/></NetworkProvider>);expect(await screen.findByText('在线')).toBeInTheDocument();act(()=>window.dispatchEvent(new Event('offline')));expect(screen.getByText('离线')).toBeInTheDocument();act(()=>window.dispatchEvent(new Event('online')));expect(await screen.findByText('在线')).toBeInTheDocument();vi.unstubAllGlobals();});});

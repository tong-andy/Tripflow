import { registerSW } from 'virtual:pwa-register';
export function registerTripFlowServiceWorker(){
  return registerSW({immediate:true,onRegisterError(error){console.error('TripFlow Service Worker registration failed',error);}});
}

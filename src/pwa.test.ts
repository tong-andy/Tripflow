import viteConfigSource from '../vite.config.ts?raw';
import indexHtml from '../index.html?raw';
describe('PWA configuration',()=>{
 it('defines install metadata and generated service worker caching',()=>{
  expect(viteConfigSource).toContain('VitePWA({');
  expect(viteConfigSource).toContain("name:'TripFlow'");
  expect(viteConfigSource).toContain("display:'standalone'");
  expect(viteConfigSource).toContain("navigateFallback:'/index.html'");
  expect(indexHtml).toContain('apple-mobile-web-app-capable');
  expect(indexHtml).toContain('apple-touch-icon');
 });
});

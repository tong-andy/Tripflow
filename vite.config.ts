import { sites } from '@openai/sites-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === 'seatbelt';

export default defineConfig({
  plugins: [
    react(), tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate', injectRegister: false,
      includeAssets: ['icons/tripflow-icon-192.png','icons/tripflow-icon-512.png','icons/tripflow-maskable-512.png'],
      manifest: {
        name:'TripFlow', short_name:'TripFlow', description:'简单、清晰的个人旅行规划与管理工具。',
        start_url:'/', scope:'/', display:'standalone', theme_color:'#28745a', background_color:'#f6f7f3', lang:'zh-CN', orientation:'portrait-primary',
        icons:[
          {src:'/icons/tripflow-icon-192.png',sizes:'192x192',type:'image/png'},
          {src:'/icons/tripflow-icon-512.png',sizes:'512x512',type:'image/png'},
          {src:'/icons/tripflow-maskable-512.png',sizes:'512x512',type:'image/png',purpose:'maskable'},
        ],
      },
      workbox:{navigateFallback:'/index.html',globPatterns:['**/*.{js,css,html,ico,png,svg,woff2}'],cleanupOutdatedCaches:true,clientsClaim:true,skipWaiting:true},
    }),
    sites(),
  ],
  server: isCodexSeatbeltSandbox
    ? { watch: { useFsEvents: false, usePolling: true } }
    : undefined,
});

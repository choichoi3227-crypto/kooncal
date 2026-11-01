import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://carrush-calc.example.com', // ← 실제 도메인으로 교체
  output: 'server',
  adapter: cloudflare({
    platformProxy: { enabled: true },
    imageService: 'passthrough',
    workerEntryPoint: { path: 'src/worker.ts', namedExports: ['ClubRoom'] },
  }),
  build: { inlineStylesheets: 'always' },
  compressHTML: true,
});

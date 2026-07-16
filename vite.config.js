import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base: './'` makes all built asset paths relative, so this works whether
// it's served at the repo root, at https://user.github.io/repo-name/, or
// from a subfolder — no need to hardcode the repo name here.
export default defineConfig({
  plugins: [react()],
  base: './',
});

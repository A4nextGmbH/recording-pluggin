import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/main.js',
      name: 'BugReporter',
      fileName: 'plugin',
      formats: ['umd']
    }
  }
});

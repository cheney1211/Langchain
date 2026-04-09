import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // 新增这行

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss() // 新增这个插件
  ],
  server: {
    port: 5173, //端口默认为5173
    open: false,
    strictPort: true,
  } 
})
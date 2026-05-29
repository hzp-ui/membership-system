import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Ant Design 生态（最大依赖）
          'vendor-antd': ['antd', '@ant-design/icons'],
          // 图表库
          'vendor-recharts': ['recharts'],
          // React 核心
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // 状态管理 + 工具
          'vendor-utils': ['zustand', 'dayjs', '@supabase/supabase-js', 'axios'],
        },
      },
    },
  },
})

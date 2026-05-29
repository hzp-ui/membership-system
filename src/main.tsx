/**
 * @file main.tsx - 应用入口文件
 * @description 使用 React 18 createRoot API 挂载根组件到 DOM
 * @module main
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import 'antd/dist/reset.css'

/** 将应用根组件挂载到 #root 节点 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
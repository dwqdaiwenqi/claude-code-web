import { Routes, Route } from 'react-router-dom'
import { ConfigProvider, App as AntdApp } from 'antd'
import HomePage from '@/pages/HomePage/index.tsx'
import ProjectPage from '@/pages/ProjectPage/index.tsx'

export default function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          borderRadius: 6,
          colorBgBase: '#ffffff',
          colorBgContainer: '#ffffff',
          colorBgElevated: '#ffffff',
          colorBorder: '#e8e8ec',
          colorText: '#1a1a1a',
          colorTextSecondary: '#888888',
          colorPrimary: '#1677ff',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontSize: 13,
        },
        components: {
          List: { colorSplit: 'transparent' },
          Tree: {
            colorBgContainer: 'transparent',
            nodeHoverBg: '#f0f0f2',
            nodeSelectedBg: '#e8f4ff',
          },
          Button: { colorBgContainer: '#ffffff', colorBorder: '#e8e8ec', defaultColor: '#1a1a1a' },
        },
      }}
    >
      <AntdApp>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/project/:projectId" element={<ProjectPage />} />
        </Routes>
      </AntdApp>
    </ConfigProvider>
  )
}

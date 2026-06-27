import { Route, Routes } from 'react-router-dom'
import AuthBootstrap from '@/components/auth/AuthBootstrap'
import HomePage from '@/pages/HomePage'
import KycPage from '@/pages/KycPage'
import SignupPage from '@/pages/SignupPage'
import LoginPage from '@/pages/LoginPage'
import KycLoginPage from '@/pages/KycLoginPage'
import DonePage from '@/pages/DonePage'
import MapDemoPage from '@/pages/MapDemoPage'

export default function App() {
  return (
    <AuthBootstrap>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/kyc" element={<KycPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/kyc-login" element={<KycLoginPage />} />
        <Route path="/done" element={<DonePage />} />
        <Route path="/map" element={<MapDemoPage />} />
      </Routes>
    </AuthBootstrap>
  )
}

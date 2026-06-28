import { Route, Routes } from 'react-router-dom'
import AuthBootstrap from '@/components/auth/AuthBootstrap'
import HomePage from '@/pages/HomePage'
import MainPage from '@/pages/MainPage'
import KycPage from '@/pages/KycPage'
import SignupPage from '@/pages/SignupPage'
import LoginPage from '@/pages/LoginPage'
import KycLoginPage from '@/pages/KycLoginPage'
import MyDataConsentPage from '@/pages/MyDataConsentPage'
import MyDataAccountsPage from '@/pages/MyDataAccountsPage'
import DonePage from '@/pages/DonePage'
import MapDemoPage from '@/pages/MapDemoPage'
import EventMapPage from '@/pages/EventMapPage'
import WalletPage from '@/pages/WalletPage'

export default function App() {
  return (
    <AuthBootstrap>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/kyc" element={<KycPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/kyc-login" element={<KycLoginPage />} />
        <Route path="/mydata/consent" element={<MyDataConsentPage />} />
        <Route path="/mydata/accounts" element={<MyDataAccountsPage />} />
        <Route path="/done" element={<DonePage />} />
        <Route path="/map" element={<MapDemoPage />} />
        <Route path="/events" element={<EventMapPage />} />
        <Route path="/wallet" element={<WalletPage />} />
      </Routes>
    </AuthBootstrap>
  )
}

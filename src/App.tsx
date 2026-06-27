import { Route, Routes } from 'react-router-dom'
import HomePage from '@/pages/HomePage'
import KycPage from '@/pages/KycPage'
import SignupPage from '@/pages/SignupPage'
import LoginPage from '@/pages/LoginPage'
import KycLoginPage from '@/pages/KycLoginPage'
import DonePage from '@/pages/DonePage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/kyc" element={<KycPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/kyc-login" element={<KycLoginPage />} />
      <Route path="/done" element={<DonePage />} />
    </Routes>
  )
}

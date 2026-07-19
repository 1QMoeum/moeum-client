import { Route, Routes } from 'react-router-dom'
import AuthBootstrap from '@/components/auth/AuthBootstrap'
import { useAutoRegisterFcmToken, useForegroundFcmNotifications } from '@/hooks/fcm'
import HomePage from '@/pages/HomePage'
import HanaSplashPage from '@/pages/HanaSplashPage'
import HanaHomePage from '@/pages/HanaHomePage'
import MoeumEntrySplashPage from '@/pages/MoeumEntrySplashPage'
import MainPage from '@/pages/MainPage'
import CalendarPage from '@/pages/CalendarPage'
import MyPage from '@/pages/MyPage'
import NotificationPage from '@/pages/NotificationPage'
import MyEventsPage from '@/pages/MyEventsPage'
import KycPage from '@/pages/KycPage'
import KycForeignPage from '@/pages/KycForeignPage'
import SignupPage from '@/pages/SignupPage'
import SignupForeignPage from '@/pages/SignupForeignPage'
import LoginPage from '@/pages/LoginPage'
import KycLoginPage from '@/pages/KycLoginPage'
import KycLoginForeignPage from '@/pages/KycLoginForeignPage'
import MyDataConsentPage from '@/pages/MyDataConsentPage'
import MyDataAccountsPage from '@/pages/MyDataAccountsPage'
import PlaidConsentPage from '@/pages/PlaidConsentPage'
import PlaidAccountsPage from '@/pages/PlaidAccountsPage'
import OnboardingPage from '@/pages/OnboardingPage'
import MapDemoPage from '@/pages/MapDemoPage'
import EventMapPage from '@/pages/EventMapPage'
import EventListPage from '@/pages/EventListPage'
import CreateEventIntroPage from '@/pages/CreateEventIntroPage'
import CreateEventPage from '@/pages/CreateEventPage'
import AiPlannerPage from '@/pages/AiPlannerPage'
import EventDetailPage from '@/pages/EventDetailPage'
import ParticipatePage from '@/pages/ParticipatePage'
import WalletPage from '@/pages/WalletPage'
import WalletTxPage from '@/pages/WalletTxPage'

export default function App() {
  useAutoRegisterFcmToken()
  useForegroundFcmNotifications()

  return (
    <AuthBootstrap>
      <Routes>
        {/* 하나원큐 인앱 진입 플로우: 스플래시 → 홈(moeum 카드) → 모음 진입 스플래시 → 모음(/start) */}
        <Route path="/" element={<HanaSplashPage />} />
        <Route path="/hana/home" element={<HanaHomePage />} />
        <Route path="/hana/moeum" element={<MoeumEntrySplashPage />} />
        <Route path="/start" element={<HomePage />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/notifications" element={<NotificationPage />} />
        <Route path="/mypage/events/:tab" element={<MyEventsPage />} />
        <Route path="/kyc" element={<KycPage />} />
        <Route path="/kyc/foreign" element={<KycForeignPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/signup/foreign" element={<SignupForeignPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/kyc-login" element={<KycLoginPage />} />
        <Route path="/kyc-login/foreign" element={<KycLoginForeignPage />} />
        <Route path="/mydata/consent" element={<MyDataConsentPage />} />
        <Route path="/mydata/accounts" element={<MyDataAccountsPage />} />
        <Route path="/plaid/consent" element={<PlaidConsentPage />} />
        <Route path="/plaid/accounts" element={<PlaidAccountsPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/map" element={<MapDemoPage />} />
        <Route path="/explore" element={<EventListPage />} />
        <Route path="/events" element={<EventMapPage />} />
        <Route path="/events/new" element={<CreateEventIntroPage />} />
        <Route path="/events/new/ai" element={<AiPlannerPage />} />
        <Route path="/events/new/manual" element={<CreateEventPage />} />
        <Route path="/events/:eventId" element={<EventDetailPage />} />
        <Route path="/events/:eventId/participate" element={<ParticipatePage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/wallet/charge" element={<WalletTxPage mode="charge" />} />
        <Route path="/wallet/convert" element={<WalletTxPage mode="convert" />} />
      </Routes>
    </AuthBootstrap>
  )
}

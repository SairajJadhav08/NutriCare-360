import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'

// Each page is its own chunk, so the landing page doesn't download the whole app
const Landing       = lazy(() => import('./pages/Landing'))
const Login         = lazy(() => import('./pages/Login'))
const Register      = lazy(() => import('./pages/Register'))
const Dashboard     = lazy(() => import('./pages/Dashboard'))
const Reminders     = lazy(() => import('./pages/Reminders'))
const Prescriptions = lazy(() => import('./pages/Prescriptions'))
const Nutrition     = lazy(() => import('./pages/Nutrition'))
const Yoga          = lazy(() => import('./pages/Yoga'))
const Profile       = lazy(() => import('./pages/Profile'))

function PageFallback() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
      <div className="spinner" />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path="/"         element={<Landing />} />
              <Route path="/login"    element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected routes — wrapped in sidebar layout */}
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/dashboard"     element={<Dashboard />} />
                <Route path="/reminders"     element={<Reminders />} />
                <Route path="/prescriptions" element={<Prescriptions />} />
                <Route path="/nutrition"     element={<Nutrition />} />
                <Route path="/yoga"          element={<Yoga />} />
                <Route path="/profile"       element={<Profile />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

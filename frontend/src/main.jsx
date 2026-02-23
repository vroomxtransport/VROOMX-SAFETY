import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'react-hot-toast'
import { PostHogProvider } from 'posthog-js/react'
import posthog from 'posthog-js'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals'
import './index.css'

// Initialize PostHog
if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
    autocapture: true,
    capture_pageview: true,
    capture_pageleave: true,
    disable_session_recording: false,
    persistence: 'localStorage',
  })
}

// Remove splash loader once React mounts
const removeLoader = () => {
  const loader = document.getElementById('app-loader')
  if (loader) {
    loader.style.opacity = '0'
    loader.style.transition = 'opacity 0.2s ease-out'
    setTimeout(() => loader.remove(), 200)
  }
}

const container = document.getElementById('root')

const AppRoot = (
  <React.StrictMode>
    <PostHogProvider client={posthog}>
      <HelmetProvider>
        <BrowserRouter>
          <ThemeProvider>
            <AuthProvider>
              <ErrorBoundary>
                <App />
              </ErrorBoundary>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'var(--toast-bg, #333)',
                    color: 'var(--toast-color, #fff)',
                  },
                }}
              />
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </HelmetProvider>
    </PostHogProvider>
  </React.StrictMode>
)

createRoot(container).render(AppRoot)

// Remove splash loader after React has mounted
removeLoader()
sessionStorage.removeItem('chunk_reload_attempted')

// Report Core Web Vitals
function sendToAnalytics(metric) {
  // Log to console in development, send to analytics in production
  if (import.meta.env.DEV) {
    console.log(metric)
  }
}

onCLS(sendToAnalytics)
onINP(sendToAnalytics)
onLCP(sendToAnalytics)
onFCP(sendToAnalytics)
onTTFB(sendToAnalytics)

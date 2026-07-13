import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HashRouter>
        {PUBLISHABLE_KEY ? (
          <ClerkProvider
            publishableKey={PUBLISHABLE_KEY}
            afterSignOutUrl="/"
            signInFallbackRedirectUrl="/#/dashboard"
            signUpFallbackRedirectUrl="/#/onboarding"
            signInForceRedirectUrl="/#/dashboard"
            signUpForceRedirectUrl="/#/onboarding"
          >
            <App />
          </ClerkProvider>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
            <div className="max-w-md text-center p-8 bg-card rounded-xl shadow-lg border border-border/50">
              <h1 className="text-2xl font-bold mb-2 text-destructive">Missing Clerk Publishable Key</h1>
              <p className="text-muted-foreground">
                Please create a <code>.env</code> file in the <code>client</code> directory and add your <code>VITE_CLERK_PUBLISHABLE_KEY</code>.
              </p>
            </div>
          </div>
        )}
      </HashRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)

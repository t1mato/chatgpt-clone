import './RootLayout.css'
import { Link, Outlet } from 'react-router-dom'
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'

// Import your publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

const RootLayout = () => {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <div className="rootLayout">
          <header>
              <Link to="/" className="logo">
                  <img src="/logo.png" alt="TIM AI IMAGE" />
                  <span>Talk Talk Goose</span>
              </Link>
              <div className="user">
                <SignedIn>
                  <UserButton />
                </SignedIn>
              </div>
          </header>
          <main>
              {/* Used as a placeholder that gets swapped with the element in main.jsx route */}
              <Outlet /> 
          </main>
      </div>
    </ClerkProvider>
  )
}

export default RootLayout
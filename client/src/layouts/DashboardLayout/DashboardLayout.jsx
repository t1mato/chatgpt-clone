import { Outlet, useNavigate } from 'react-router-dom'
import './DashboardLayout.css'
import { useAuth } from '@clerk/clerk-react'
import { useEffect } from 'react'
import ChatList from '../../components/ChatList/ChatList'

/**
 * DashboardLayout
 * 
 * Provides a two-column layout for authenticated users:
 * - Left panel: Chat list / navigation
 * - Right panel: Active chat or route content
 * 
 * Handles authentication guard using Clerk.
 */
const DashboardLayout = () => {

  // Extract user info from Clerk's auth context
  // - userId: present when the user is signed in
  // - isLoaded: true when Clerk has finished loading session data
  const {userId, isLoaded} = useAuth()

  // For redirects and navigation
  const navigate = useNavigate()

  /**
   * Effect: Redirect unauthenticated users
   * 
   * Once Clerk finishes loading, if there's no signed-in user,
   * immediately navigate to the /sign-in route.
   * 
   * Depend on `isLoaded` `userId`, and `navigate` to ensure this
   * runs only necessary and always reacts to auth changes
   */
  useEffect(() => {
    if(isLoaded && !userId) {
      navigate("/sign-in");
    }
  }, [isLoaded, userId, navigate])

  /**
   * While Clerk is still initializing, show placeholder.
   * This prevents the UI from flashing unauthorized content
   * before redirect logic can run.
   */
  if (!isLoaded) return "Loading...";

  /**
   * Layout structure:
   * - `.dashboardLayout` wraps the entire dashboard view.
   * - `.menu`: sidebar region for chat navigation
   * - 
   */
  return (
    <div className="dashboardLayout">
        <div className="menu"><ChatList /></div>
        <div className="content">
            <Outlet />
        </div>
    </div>
  )
}

export default DashboardLayout
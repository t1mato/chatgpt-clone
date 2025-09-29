import './RootLayout.css'
import { Link, Outlet } from 'react-router-dom'

const RootLayout = () => {
  return (
    <div className="rootLayout">
        <header>
            <Link to="/" className="logo">
                <img src="/logo.png" alt="TIM AI IMAGE" />
                <span>TIM AI</span>
            </Link>
            <div className="user">User</div>
        </header>
        <main>
            {/* Used as a placeholder that gets swapped with the element in main.jsx route */}
            <Outlet /> 
        </main>
    </div>
  )
}

export default RootLayout
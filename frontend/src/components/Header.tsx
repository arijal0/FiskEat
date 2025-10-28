import { useNavigate, useLocation } from 'react-router-dom'

function Header() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white text-xl">🍽️</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">FiskEat</h1>
          </div>
          
          <nav className="flex items-center space-x-4">
            {location.pathname === '/' && (
              <button
                onClick={() => navigate('/menu')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                View Menu
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header


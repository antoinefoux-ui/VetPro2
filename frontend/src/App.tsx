import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'

// You can create more pages as needed
// import Clients from './pages/Clients'
// import Appointments from './pages/Appointments'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        {/* Navigation Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">VetPro</h1>
              
              <nav className="flex gap-4">
                <Link to="/" className="text-blue-600 hover:text-blue-800">
                  Dashboard
                </Link>
                <Link to="/clients" className="text-blue-600 hover:text-blue-800">
                  Clients
                </Link>
                <Link to="/appointments" className="text-blue-600 hover:text-blue-800">
                  Appointments
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            {/* Add more routes as you create pages */}
            {/* <Route path="/clients" element={<Clients />} /> */}
            {/* <Route path="/appointments" element={<Appointments />} /> */}
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App

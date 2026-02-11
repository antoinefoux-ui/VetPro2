import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import Eshop from './pages/Eshop'
import Invoices from './pages/Invoices'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">VetPro</h1>
              
              <nav className="flex gap-4">
                <Link to="/" className="text-blue-600 hover:text-blue-800">
                  Dashboard
                </Link>
                <Link to="/admin" className="text-blue-600 hover:text-blue-800">
                  Admin
                </Link>
                <Link to="/eshop" className="text-blue-600 hover:text-blue-800">
                  E-Shop
                </Link>
                <Link to="/invoices" className="text-blue-600 hover:text-blue-800">
                  Invoices
                </Link>
              </nav>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/eshop" element={<Eshop />} />
            <Route path="/invoices" element={<Invoices />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App

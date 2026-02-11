import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4">
            <h1 className="text-3xl font-bold text-gray-900">
              VetPro Platform
            </h1>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-6 px-4">
          <Routes>
            <Route path="/" element={
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-4">
                  Welcome to VetPro
                </h2>
                <p className="text-gray-600">
                  Veterinary Practice Management Platform
                </p>
                <p className="text-sm text-gray-500 mt-4">
                  Note: Backend is not yet deployed. Frontend preview only.
                </p>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App

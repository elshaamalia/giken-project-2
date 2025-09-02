import { Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard.jsx';
import History from './pages/History.jsx';

function App() {
  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </div>
  );
}

export default App;
import { Routes, Route } from 'react-router-dom';
import { LoginPage } from './auth/LoginPage';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { DashboardPage } from './pages/DashboardPage';

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <p className="mt-2 text-gray-600">Deze pagina wordt binnenkort gebouwd.</p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/scholen" element={<PlaceholderPage title="Scholen" />} />
        <Route path="/documenten" element={<PlaceholderPage title="Documenten" />} />
        <Route path="/gebruikers" element={<PlaceholderPage title="Gebruikers" />} />
      </Route>
    </Routes>
  );
}

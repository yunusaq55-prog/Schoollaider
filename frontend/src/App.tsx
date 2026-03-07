import { Routes, Route } from 'react-router-dom';
import { LoginPage } from './auth/LoginPage';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { DashboardPage } from './pages/DashboardPage';
import { DocumenthubPage } from './pages/DocumenthubPage';
import { InspectiekaderPage } from './pages/InspectiekaderPage';
import { PdcaPage } from './pages/PdcaPage';
import { HrDashboardPage } from './pages/hr/HrDashboardPage';
import { HrFormatiePage } from './pages/hr/HrFormatiePage';
import { HrVerzuimPage } from './pages/hr/HrVerzuimPage';
import { HrVervangingPage } from './pages/hr/HrVervangingPage';
import { HrLeeftijdPage } from './pages/hr/HrLeeftijdPage';
import { ScholenPage } from './pages/ScholenPage';

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
        {/* Kwaliteitsbeheer */}
        <Route path="/" element={<DashboardPage />} />
        <Route path="/documenten" element={<DocumenthubPage />} />
        <Route path="/inspectiekader" element={<InspectiekaderPage />} />
        <Route path="/pdca" element={<PdcaPage />} />

        {/* HR Module */}
        <Route path="/hr" element={<HrDashboardPage />} />
        <Route path="/hr/formatie" element={<HrFormatiePage />} />
        <Route path="/hr/verzuim" element={<HrVerzuimPage />} />
        <Route path="/hr/vervanging" element={<HrVervangingPage />} />
        <Route path="/hr/leeftijd" element={<HrLeeftijdPage />} />

        {/* Beheer */}
        <Route path="/scholen" element={<ScholenPage />} />
        <Route path="/gebruikers" element={<PlaceholderPage title="Gebruikers" />} />
      </Route>
    </Routes>
  );
}

import { Routes, Route } from 'react-router-dom';
import { LoginPage } from './auth/LoginPage';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ScholenBeheerPage } from './pages/ScholenBeheerPage';
import { DocumentHubPage } from './pages/DocumentHubPage';
import { InspectieKaderPage } from './pages/InspectieKaderPage';
import { PdcaPage } from './pages/PdcaPage';
import { GebruikersBeheerPage } from './pages/GebruikersBeheerPage';
import { HrDashboardPage } from './pages/hr/HrDashboardPage';
import { HrFormatiePage } from './pages/hr/HrFormatiePage';
import { HrVerzuimPage } from './pages/hr/HrVerzuimPage';
import { HrVervangingPage } from './pages/hr/HrVervangingPage';
import { HrLeeftijdPage } from './pages/hr/HrLeeftijdPage';

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
        <Route path="/scholen" element={<ScholenBeheerPage />} />
        <Route path="/documenten" element={<DocumentHubPage />} />
        <Route path="/inspectiekader" element={<InspectieKaderPage />} />
        <Route path="/pdca" element={<PdcaPage />} />
        <Route path="/gebruikers" element={<GebruikersBeheerPage />} />
        <Route path="/hr" element={<HrDashboardPage />} />
        <Route path="/hr/formatie" element={<HrFormatiePage />} />
        <Route path="/hr/verzuim" element={<HrVerzuimPage />} />
        <Route path="/hr/vervanging" element={<HrVervangingPage />} />
        <Route path="/hr/leeftijd" element={<HrLeeftijdPage />} />
      </Route>
    </Routes>
  );
}

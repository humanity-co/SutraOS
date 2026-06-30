import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './Login';
import Dashboard from './Dashboard';
import Directory from './Directory';
import Finance from './Finance';
import MyHR from './MyHR';
import Academics from './Academics';
import PlacementsCampus from './PlacementsCampus';
import Facilities from './Facilities';
import Research from './Research';
import Documents from './Documents';
import Admissions from './Admissions';
import Layout from './Layout';

function AppContent() {
  const { token } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={
        !token ? <Login /> : <Navigate to="/" replace />
      } />
      <Route path="/" element={
        token ? <Layout><Dashboard /></Layout> : <Navigate to="/login" replace />
      } />
      <Route path="/directory" element={
        token ? <Layout><Directory /></Layout> : <Navigate to="/login" replace />
      } />
      <Route path="/finance" element={
        token ? <Layout><Finance /></Layout> : <Navigate to="/login" replace />
      } />
      <Route path="/myhr" element={
        token ? <Layout><MyHR /></Layout> : <Navigate to="/login" replace />
      } />
      <Route path="/academics" element={
        token ? <Layout><Academics /></Layout> : <Navigate to="/login" replace />
      } />
      <Route path="/facilities" element={
        token ? <Layout><Facilities /></Layout> : <Navigate to="/login" replace />
      } />
      <Route path="/placements-campus" element={
        token ? <Layout><PlacementsCampus /></Layout> : <Navigate to="/login" replace />
      } />
      <Route path="/research" element={
        token ? <Layout><Research /></Layout> : <Navigate to="/login" replace />
      } />
      <Route path="/documents" element={
        token ? <Layout><Documents /></Layout> : <Navigate to="/login" replace />
      } />
      <Route path="/admissions" element={
        token ? <Layout><Admissions /></Layout> : <Navigate to="/login" replace />
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

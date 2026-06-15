import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import InterviewSetupPage from "./pages/InterviewSetupPage";
import InterviewPage from "./pages/InterviewPage";
import ResultsPage from "./pages/ResultsPage";
import ResumePage from "./pages/ResumePage";
import AnalyticsPage from "./pages/AnalyticsPage";
import Layout from "./components/common/Layout";

function PrivateRoute({ children }: { children: React.ReactNode })
{
  const token = useAuthStore((s) => s.token);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
        >
          <Route index element={<DashboardPage />} />
          <Route path="interview/new" element={<InterviewSetupPage />} />
          <Route path="interview/:id" element={<InterviewPage />} />
          <Route path="interview/:id/results" element={<ResultsPage />} />
          <Route path="resume" element={<ResumePage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
        </Route>
    </Routes>
  );
}
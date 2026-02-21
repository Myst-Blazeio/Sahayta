
import { Routes, Route } from "react-router-dom";
import CitizenHome from "./pages/CitizenHome";
import CitizenPortal from "./pages/CitizenPortal";
import CitizenLogin from "./pages/auth/CitizenLogin";
import CitizenSignup from "./pages/auth/CitizenSignup";
import CitizenProfile from "./pages/CitizenProfile";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased font-sans">
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<CitizenHome />} />

          {/* Auth Routes */}
          <Route path="/citizen/login" element={<CitizenLogin />} />
          <Route path="/citizen/signup" element={<CitizenSignup />} />

          {/* Citizen Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={["citizen"]} />}>
            <Route
              path="/dashboard/citizen/:username"
              element={<CitizenPortal />}
            />
            <Route path="/citizen/profile" element={<CitizenProfile />} />
          </Route>
        </Routes>
      </AuthProvider>
    </div>
  );
}

export default App;

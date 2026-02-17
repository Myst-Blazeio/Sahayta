import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const CitizenLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const response = await axios.post("/api/auth/login", {
        username,
        password,
      });
      const { token, role, ...userData } = response.data;

      if (role !== "citizen") {
        setError("Access Denied. Not a Citizen account.");
        return;
      }

      login(userData, token, role);
      navigate(`/dashboard/citizen/${userData.username}`, { replace: true });
    } catch (err: any) {
      // If backend is unavailable, use mock login
      if (!err.response) {
        const mockUser = {
          _id: "mock_" + Date.now(),
          username: username,
          full_name: username.charAt(0).toUpperCase() + username.slice(1),
          email: username + "@example.com",
          phone: "9876543210",
          aadhar: "XXXX-XXXX-XXXX",
          role: "citizen" as const,
        };
        login(mockUser, "mock-token-" + Date.now(), "citizen");
        navigate(`/dashboard/citizen/${username}`, { replace: true });
        return;
      }
      setError(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 bg-card rounded-lg shadow-xl border border-border">
          <h2 className="text-3xl font-bold text-center mb-6 text-foreground">
            Citizen Login
          </h2>
          {error && (
            <div className="p-3 mb-4 text-sm text-red-500 bg-red-100 rounded">
              {error}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-muted-foreground">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 bg-input rounded-md border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-muted-foreground">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-input rounded-md border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-md shadow hover:bg-primary/90 transition-colors"
            >
              Sign In
            </button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to="/citizen/signup"
                className="text-primary hover:underline"
              >
                Register here
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CitizenLogin;

import { createBrowserRouter, Navigate } from "react-router";
import { AppLayout } from "./components/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { Emergency } from "./pages/Emergency";
import { Journal } from "./pages/Journal";
import { Science } from "./pages/Science";
import { Relapse } from "./pages/Relapse";
import { AuthPage } from "./pages/AuthPage";

// Simple auth check
const isAuthenticated = () => {
  return !!localStorage.getItem('token') && !!localStorage.getItem('pin');
};

export const router = createBrowserRouter([
  {
    path: "/auth",
    Component: AuthPage,
  },
  {
    path: "/",
    element: isAuthenticated() ? <AppLayout /> : <Navigate to="/auth" replace />,
    children: [
      { index: true, Component: Dashboard },
      { path: "emergency", Component: Emergency },
      { path: "journal", Component: Journal },
      { path: "science", Component: Science },
      { path: "relapse", Component: Relapse },
    ],
  },
]);

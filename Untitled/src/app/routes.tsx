import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { AppLayout } from "./components/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { Emergency } from "./pages/Emergency";
import { Journal } from "./pages/Journal";
import { Science } from "./pages/Science";
import { Relapse } from "./pages/Relapse";
import { AuthPage } from "./pages/AuthPage";
import { BuddyChat } from "./pages/BuddyChat";

// Auth guard component - checks on every render
function AuthGuard() {
  const token = localStorage.getItem('token');
  const pin = localStorage.getItem('pin');
  
  if (!token || !pin) {
    return <Navigate to="/auth" replace />;
  }
  
  return <AppLayout />;
}

export const router = createBrowserRouter([
  {
    path: "/auth",
    Component: AuthPage,
  },
  {
    path: "/",
    element: <AuthGuard />,
    children: [
      { index: true, Component: Dashboard },
      { path: "emergency", Component: Emergency },
      { path: "journal", Component: Journal },
      { path: "science", Component: Science },
      { path: "relapse", Component: Relapse },
      { path: "chat/:buddyId", Component: BuddyChat },
    ],
  },
]);

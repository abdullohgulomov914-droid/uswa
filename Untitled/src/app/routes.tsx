import { createBrowserRouter, Navigate } from "react-router";
import { AppLayout } from "./components/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { Emergency } from "./pages/Emergency";
import { Journal } from "./pages/Journal";
import { Science } from "./pages/Science";
import { Relapse } from "./pages/Relapse";
import { AuthPage } from "./pages/AuthPage";
import { BuddyChat } from "./pages/BuddyChat";
import { StreakAnalytics } from "./pages/StreakAnalytics";
import { LevelPage } from "./pages/LevelPage";
import { AdminPanel } from "./pages/AdminPanel";
import { CommunityChat } from "./pages/CommunityChat";
import { NotificationsPage } from "./pages/NotificationsPage";
import { PollsPage } from "./pages/PollsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ChatsListPage } from "./pages/ChatsListPage";

// Auth guard component - checks on every render
function AuthGuard() {
  const pin = localStorage.getItem('pin');
  const pinVerified = sessionStorage.getItem('pin_verified');

  // Must have pin set AND verified in this session
  if (!pin || !pinVerified) {
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
      { path: "streak", Component: StreakAnalytics },
      { path: "level", Component: LevelPage },
      { path: "admin", Component: AdminPanel },
      { path: "community", Component: CommunityChat },
      { path: "notifications", Component: NotificationsPage },
      { path: "polls", Component: PollsPage },
      { path: "settings", Component: SettingsPage },
      { path: "chats", Component: ChatsListPage },
    ],
  },
]);

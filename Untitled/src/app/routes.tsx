import { createBrowserRouter } from "react-router";
import { AppLayout } from "./components/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { Emergency } from "./pages/Emergency";
import { Journal } from "./pages/Journal";
import { Science } from "./pages/Science";
import { Relapse } from "./pages/Relapse";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AppLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "emergency", Component: Emergency },
      { path: "journal", Component: Journal },
      { path: "science", Component: Science },
      { path: "relapse", Component: Relapse },
    ],
  },
]);

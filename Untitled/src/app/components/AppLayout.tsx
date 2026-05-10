import { Outlet, NavLink, useLocation } from "react-router";
import { Home, BookOpen, Activity, RefreshCw } from "lucide-react";
import { motion } from "motion/react";

// Sahifalar navbar ko'rsatilmasin
const HIDE_NAV = ['/chat/', '/community', '/chats', '/ai-chat', '/notifications', '/polls', '/admin', '/streak', '/level', '/settings'];

export function AppLayout() {
  const location = useLocation();
  const hideNav = HIDE_NAV.some(p => location.pathname.startsWith(p));

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-950 text-slate-100 font-sans overflow-hidden">
      <main className={`flex-1 overflow-y-auto relative ${hideNav ? '' : 'pb-24'}`}>
        <Outlet />
      </main>

      {!hideNav && (
        <nav className="absolute bottom-0 left-0 right-0 h-20 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800 flex items-center justify-around px-2 z-50 rounded-t-3xl shadow-[0_-10px_40px_-10px_rgba(46,204,113,0.1)]">
          <NavItem to="/" icon={<Home size={24} />} label="Pulse" active={location.pathname === "/"} />
          <NavItem to="/journal" icon={<BookOpen size={24} />} label="STAR+" active={location.pathname === "/journal"} />

          {/* Emergency FAB */}
          <div className="relative -top-6">
            <NavLink to="/emergency">
              {({ isActive }) => (
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 border-4 border-slate-950 overflow-hidden ${isActive ? 'ring-2 ring-emerald-400' : ''}`}
                >
                  <img src="/emergency-icon.jpg" alt="SOS" className="w-full h-full object-cover rounded-full" />
                </motion.div>
              )}
            </NavLink>
          </div>

          <NavItem to="/science" icon={<Activity size={24} />} label="Ilmiy" active={location.pathname === "/science"} />
          <NavItem to="/relapse" icon={<RefreshCw size={24} />} label="Tiklanish" active={location.pathname === "/relapse"} />
        </nav>
      )}
    </div>
  );
}

function NavItem({ to, icon, label, active }: { to: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <NavLink to={to} className="flex flex-col items-center justify-center w-16 gap-1">
      <motion.div
        animate={{ scale: active ? 1.1 : 1, color: active ? "#2ECC71" : "#64748b" }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {icon}
      </motion.div>
      <span className={`text-[10px] font-medium ${active ? 'text-emerald-400' : 'text-slate-500'}`}>
        {label}
      </span>
    </NavLink>
  );
}

import { useState } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { BookOpen, LogOut, CheckCircle, LayoutDashboard } from "lucide-react";

export default function Layout() {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const confirmLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <nav className="glass shadow-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link to="/dashboard" className="flex items-center gap-3 group">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2.5 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <BookOpen className="w-7 h-7 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                  Mastery
                </span>
              </Link>
              <div className="hidden md:flex items-center gap-2">
                <Link 
                  to="/dashboard" 
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 transition-all duration-300"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  Dashboard
                </Link>
                <Link 
                  to="/subjects/all" 
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 transition-all duration-300"
                >
                  <CheckCircle className="w-5 h-5" />
                  Subjects
                </Link>
              </div>
            </div>
            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-300"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-8 md:px-6 md:py-10">
        <div className="glass-card rounded-3xl p-6 md:p-8">
          <Outlet />
        </div>
      </main>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card rounded-3xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="pt-10 pb-7 px-8 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center mb-6 ring-8 ring-red-50">
                <LogOut className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Log out of Mastery?</h3>
              <p className="text-gray-600 text-center text-sm leading-relaxed">
                You will need to sign back in to access your modules and subjects.
              </p>
            </div>
            
            <div className="flex bg-gradient-to-b from-gray-50 to-white px-8 py-6 gap-4 border-t border-gray-100">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 text-gray-700 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 rounded-2xl transition-all duration-300 font-bold text-sm shadow-sm"
              >
                Cancel
              </button>
              <button 
                onClick={confirmLogout}
                className="flex-1 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-lg rounded-2xl transition-all duration-300 font-bold text-sm shadow-red-500/30 hover:shadow-red-500/40"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

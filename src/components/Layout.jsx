import { useState } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { BookOpen, LogOut, CheckCircle, LayoutDashboard } from "lucide-react";

export default function Layout() {
  const navigate = useNavigate();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const confirmLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-blue-600 tracking-tight">
            <BookOpen className="w-6 h-6" />
            <span>Mastery</span>
          </Link>
          <div className="hidden md:flex items-center gap-4 text-sm font-medium text-gray-600">
            <Link to="/dashboard" className="hover:text-blue-600 flex items-center gap-1"><LayoutDashboard className="w-4 h-4"/> Dashboard</Link>
            <Link to="/subjects/all" className="hover:text-blue-600 flex items-center gap-1"><CheckCircle className="w-4 h-4"/> Subjects</Link>
          </div>
        </div>
        <button 
          onClick={() => setShowLogoutConfirm(true)}
          className="text-gray-500 hover:text-red-500 flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </nav>
      <main className="flex-1 w-full max-w-none mx-auto px-4 py-5 md:px-6 md:py-6">
        <Outlet />
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4 transform transition-all items-center flex flex-col pt-8 pb-7 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <LogOut className="w-6 h-6 text-red-600 ml-1" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Log out of Mastery?</h3>
            <p className="text-gray-500 mb-8 text-center text-sm font-medium px-2">You will need to sign back in to access your modules and subjects.</p>
            
            <div className="flex w-full gap-3">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-semibold text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={confirmLogout}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm transition-colors font-semibold text-sm"
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

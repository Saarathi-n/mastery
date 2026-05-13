import { Outlet, Link, useNavigate } from "react-router-dom";
import { BookOpen, LogOut, CheckCircle, LayoutDashboard } from "lucide-react";

export default function Layout() {
  const navigate = useNavigate();

  const handleLogout = () => {
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
          onClick={handleLogout}
          className="text-gray-500 hover:text-red-500 flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </nav>
      <main className="flex-1 w-full max-w-none mx-auto px-4 py-5 md:px-6 md:py-6">
        <Outlet />
      </main>
    </div>
  );
}

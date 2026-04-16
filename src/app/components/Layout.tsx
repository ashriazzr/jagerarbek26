import { Outlet, Link, useLocation } from "react-router";
import { 
  LayoutDashboard, 
  ClipboardList, 
  BarChart3, 
  Package, 
  ListChecks, 
  Database,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

export function Layout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/keterlambatan", icon: ClipboardList, label: "Absensi Keterlambatan" },
    { path: "/akumulasi", icon: BarChart3, label: "Laporan Keterlambatan" },
    { path: "/razia", icon: Package, label: "Form Razia" },
    { path: "/siswa", icon: Database, label: "Data Siswa" },
    { path: "/tutorial", icon: ListChecks, label: "Tutorial GitHub Pages" },
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ClipboardList className="w-8 h-8" />
              <div>
                <h1 className="text-xl font-bold">Sistem Absensi Keterlambatan</h1>
                <p className="text-xs text-blue-100">Manajemen Keterlambatan Siswa</p>
              </div>
            </div>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-blue-700"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className={`
            ${isMobileMenuOpen ? 'block' : 'hidden'} 
            lg:block lg:w-64 bg-white rounded-lg shadow-md p-4 h-fit lg:sticky lg:top-24
          `}>
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                      ${active 
                        ? 'bg-blue-50 text-blue-600 font-medium' 
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

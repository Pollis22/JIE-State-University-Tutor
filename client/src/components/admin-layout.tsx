import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  ScrollText,
  Mail,
  LogOut,
  Menu,
  X,
  GraduationCap,
} from "lucide-react";
import { useState } from "react";
import suLogo from "@/assets/state-university-logo.png";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Students", href: "/admin/users", icon: Users },
    { name: "Documents", href: "/admin/documents", icon: FileText },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { name: "Contacts", href: "/admin/contacts", icon: Mail },
    { name: "SRM Tracker", href: "/admin/academic-tracker", icon: GraduationCap },
    { name: "Audit Logs", href: "/admin/logs", icon: ScrollText },
  ];

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => setLocation("/auth"),
    });
  };

  return (
    <div className="min-h-screen" style={{ background: "#FFFFFF" }}>
      {/* Admin Header */}
      <header style={{ background: "#282728", color: "white", borderBottom: "4px solid #C5050C" }}>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <img src={suLogo} alt="State University" style={{ height: 40 }} />
              <div>
                <h1 className="text-xl font-bold" style={{ fontFamily: "'Red Hat Display', sans-serif" }}>Admin Dashboard</h1>
                <p className="text-xs" style={{ color: "#999" }}>State University AI Tutor</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{user?.firstName || user?.username}</p>
                <p className="text-xs" style={{ color: "#999" }}>Administrator</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:bg-slate-800">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className={`${sidebarOpen ? "block" : "hidden"} lg:block w-64 min-h-[calc(100vh-4rem)] fixed lg:sticky top-16 z-40`}
          style={{ background: "#282728", color: "white" }}>
          <nav className="p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <button key={item.name}
                  onClick={() => { setLocation(item.href); setSidebarOpen(false); }}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors"
                  style={{
                    background: isActive ? "#C5050C" : "transparent",
                    color: isActive ? "white" : "#999",
                  }}>
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </button>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1 p-6 lg:ml-0">{children}</main>
      </div>
    </div>
  );
}

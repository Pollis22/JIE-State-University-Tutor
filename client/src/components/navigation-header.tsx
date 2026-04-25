import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/UserAvatar";
import { Menu, X } from "lucide-react";
import suLogo from "@/assets/state-university-logo.png";

export function NavigationHeader() {
  const { user, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: dashboard } = useQuery<{
    user?: { name?: string; firstName?: string; initials?: string };
  }>({
    queryKey: ["/api/dashboard"],
    enabled: !!user,
  });
  
  const displayName = dashboard?.user?.name || 
    `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 
    user?.username || 
    'Student';

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => setLocation("/auth"),
    });
  };

  const isActive = (path: string) => {
    const basePath = path.split("#")[0];
    return location === basePath;
  };

  const navigateTo = (path: string) => {
    if (path.includes("#")) {
      const [basePath, hash] = path.split("#");
      if (location === basePath) {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
      } else {
        setLocation(basePath);
        setTimeout(() => {
          document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
        }, 500);
      }
    } else {
      setLocation(path);
    }
  };

  const navLinks = [
    { label: "Tutor", path: "/tutor" },
    { label: "Dashboard", path: "/dashboard" },
    { label: "Academic SRM", path: "/academic-dashboard" },
    { label: "What is LSIS?", path: "/about-lsis" },
    { label: "Features", path: "/features" },
    { label: "College Test Prep", path: "/features#test-prep" },
    { label: "Best Practices", path: "/best-practices" },
    { label: "Support", path: "/support" },
    { label: "Settings", path: "/settings" },
    ...(user?.role === "admin" ? [{ label: "Admin", path: "/admin" }] : []),
  ];

  return (
    <nav style={{ background: "#FFFFFF", borderBottom: "1px solid #E8E8E8", position: "sticky", top: 0, zIndex: 50 }}>
      {/* Cardinal red top bar */}
      <div style={{ height: 4, background: "#C5050C" }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer flex-shrink-0" onClick={() => setLocation("/tutor")}>
            <img src={suLogo} alt="State University" style={{ height: 44 }} />
            <div className="hidden sm:block" style={{ borderLeft: "1px solid #DAD7CB", paddingLeft: 12 }}>
              <div style={{ fontFamily: "'Red Hat Display', sans-serif", fontWeight: 700, fontSize: 15, color: "#282728", lineHeight: 1.1, whiteSpace: "nowrap" }}>AI Tutor</div>
              <div style={{ fontSize: 9, color: "#646569", fontWeight: 500, letterSpacing: 1, textTransform: "uppercase", whiteSpace: "nowrap" }}>State University</div>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-0.5 xl:gap-1 flex-1 justify-center min-w-0">
            {navLinks.map(item => (
              <button
                key={item.path}
                onClick={() => navigateTo(item.path)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: isActive(item.path) ? 600 : 500,
                  color: isActive(item.path) ? "#C5050C" : "#646569",
                  background: isActive(item.path) ? "rgba(197,5,12,0.06)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'Red Hat Text', sans-serif",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Right side: User Menu + Mobile Hamburger */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <UserAvatar name={displayName} size="sm" />
                  <span className="hidden md:inline text-sm font-medium whitespace-nowrap max-w-[120px] truncate" style={{ color: "#282728" }}>{displayName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setLocation("/profile")}>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/settings")}>
                  Settings
                </DropdownMenuItem>
                {user?.role === "admin" && (
                  <DropdownMenuItem onClick={() => setLocation("/admin")}>
                    Admin Panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              className="lg:hidden p-2 rounded-md"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ border: "1px solid #E8E8E8", background: "transparent" }}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" style={{ color: "#282728" }} /> : <Menu className="w-5 h-5" style={{ color: "#282728" }} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden" style={{ borderTop: "1px solid #E8E8E8", background: "#FFFFFF" }}>
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(item => (
              <button
                key={item.path}
                onClick={() => { navigateTo(item.path); setMobileMenuOpen(false); }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 14px",
                  borderRadius: 6,
                  fontSize: 15,
                  fontWeight: isActive(item.path) ? 600 : 500,
                  color: isActive(item.path) ? "#C5050C" : "#282728",
                  background: isActive(item.path) ? "rgba(197,5,12,0.06)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'Red Hat Text', sans-serif",
                }}
              >
                {item.label}
              </button>
            ))}
            <div style={{ borderTop: "1px solid #E8E8E8", marginTop: 8, paddingTop: 8 }}>
              <button
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 14px",
                  borderRadius: 6,
                  fontSize: 15,
                  fontWeight: 500,
                  color: "#C5050C",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'Red Hat Text', sans-serif",
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

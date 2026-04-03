import { useState } from "react";
import { useLocation } from "wouter";
import { Menu, X, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PublicMobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();

  const menuItems = [
    { label: "Sign In", path: "/auth" },
    { label: "Terms", path: "/terms" },
    { label: "Privacy", path: "/privacy" },
  ];

  return (
    <div className="md:hidden">
      <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg p-4 space-y-2">
          {menuItems.map(item => (
            <button key={item.path} onClick={() => { setLocation(item.path); setIsOpen(false); }}
              className="block w-full text-left px-4 py-2 text-sm rounded hover:bg-gray-50" style={{ color: "#282728" }}>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

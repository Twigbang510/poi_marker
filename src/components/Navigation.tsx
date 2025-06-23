import { Link, useLocation } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Home, Users, MapPin, Menu } from "lucide-react";
import { useState } from "react";

export default function Navigation() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <MapPin className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Location Tracker</span>
            </Link>
          </div>
          
          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/">
              <Button 
                variant={isActive("/") ? "default" : "ghost"}
                size="sm"
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
            
            <Link to="/user">
              <Button 
                variant={isActive("/user") ? "default" : "ghost"}
                size="sm"
              >
                <MapPin className="h-4 w-4 mr-2" />
                User
              </Button>
            </Link>
            
            <Link to="/admin">
              <Button 
                variant={isActive("/admin") ? "default" : "ghost"}
                size="sm"
              >
                <Users className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center">
            <button
              className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6 text-gray-700" />
            </button>
          </div>
        </div>
        {/* Mobile menu dropdown */}
        {menuOpen && (
          <div className="md:hidden mt-2 pb-2 flex flex-col space-y-2 animate-fade-in">
            <Link to="/" onClick={() => setMenuOpen(false)}>
              <Button 
                variant={isActive("/") ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start"
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
            <Link to="/user" onClick={() => setMenuOpen(false)}>
              <Button 
                variant={isActive("/user") ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start"
              >
                <MapPin className="h-4 w-4 mr-2" />
                User
              </Button>
            </Link>
            <Link to="/admin" onClick={() => setMenuOpen(false)}>
              <Button 
                variant={isActive("/admin") ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start"
              >
                <Users className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
} 
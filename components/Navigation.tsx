"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Menu } from "lucide-react";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/" },
  { name: "Problems", href: "/problems" },
  { name: "Attempts", href: "/attempts" },
  { name: "Stats", href: "/stats" },
  { name: "Leaderboard", href: "/leaderboard" },
];

export function Navigation() {
  const pathname = usePathname();
  // Initialize as null to indicate we're checking authentication status
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name: string } | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("authToken");
    setIsLoggedIn(!!token);

    // Get user info
    const userStr = localStorage.getItem("currentUser");
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }

    // Listen for storage changes in case login/logout happens in another tab
    const handleStorageChange = () => {
      const newToken = localStorage.getItem("authToken");
      setIsLoggedIn(!!newToken);

      const newUserStr = localStorage.getItem("currentUser");
      if (newUserStr) {
        try {
          setUser(JSON.parse(newUserStr));
        } catch (e) {
          console.error("Error parsing user data:", e);
        }
      } else {
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    // Dispatch a storage event to trigger the storage event listener
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'authToken',
      oldValue: localStorage.getItem('authToken'),
      newValue: null
    }));
    window.location.href = "/login";
  };

  // Don't render anything while checking authentication status
  if (isLoggedIn === null) {
    return null;
  }

  // Don't render the navigation if not logged in
  if (!isLoggedIn) {
    return null;
  }

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] p-0">
              <div className="p-4">
                <nav className="grid gap-6 text-lg font-medium">
                  {NAV_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`hover:text-foreground ${pathname === item.href ? "text-foreground" : "text-muted-foreground"}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                  <div className="mt-auto border-t pt-4">
                    {user && (
                      <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    )}
                    <Button variant="destructive" className="w-full justify-start" onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}>
                      Logout
                    </Button>
                  </div>
                </nav>
              </div>
            </DialogContent>
          </Dialog>
          <Link href="/" className="text-xl font-bold">
            DSA Tracker
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`transition-colors hover:text-foreground ${pathname === item.href ? "text-foreground" : "text-muted-foreground"}`}
            >
              {item.name}
            </Link>
          ))}
          {user && (
            <div className="flex items-center gap-2 mr-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium text-foreground">{user.name}</span>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={handleLogout} className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20">
            Logout
          </Button>
        </nav>
      </div>
    </header>
  );
}
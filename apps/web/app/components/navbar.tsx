"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { IoExitOutline } from "react-icons/io5";
import { logout, getCurrentUser, type AuthUser } from "../lib/auth/api";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const data = await getCurrentUser();
        setUser(data);
      } catch (error) {
        console.error("Failed to fetch current user:", error);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  if (loading) return <p>Loading profile...</p>;
  if (!user) return <p>User not found</p>;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      router.replace("/login");
    }
  };

  const navItemClass = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)
      ? "rounded-2xl bg-blue-400 px-3 py-4 text-white transition-colors hover:bg-blue-500"
      : "rounded-2xl px-3 py-4 transition-colors hover:bg-blue-400 hover:text-white";

  const isDashboard = pathname === "/dashboard";

  const navBackground = isDashboard
    ? "bg-transparent"
    : "bg-blue-400 backdrop-blur-md border border-white/10 shadow-lg shadow-black/20";

  return (
    <nav
      className={`w-full mt-4 mx-5 flex items-center justify-between rounded-3xl px-5 py-3 text-gray-400 transition-all duration-300 ${
        navBackground
      }`}
    >
      <div className="text-left font-bold text-2xl text-white">
        <span className="">E-hailing Safety | {user?.name}</span>
      </div>
      <ul className="bg-white p-4 flex list-none items-center gap-2 rounded-3xl text-lg sm:gap-4 px-4">
        <li>
          <a href="/dashboard" className={navItemClass("/dashboard")}>
            Dashboard
          </a>
        </li>
        <li>
          <a href="/reports" className={navItemClass("/reports")}>
            Reports
          </a>
        </li>
        <li>
          <a href="/file-report" className={navItemClass("/file-report")}>
            File Report
          </a>
        </li>
        <li>
          <a href="/profile" className={navItemClass("/profile")}>
            Profile
          </a>
        </li>
        <li>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Logout"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-red-600 transition-colors hover:bg-red-600 hover:text-white"
          >
            <IoExitOutline className="text-2xl" />
          </button>
        </li>
      </ul>
    </nav>
  );
}

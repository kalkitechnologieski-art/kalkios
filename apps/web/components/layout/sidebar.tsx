"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Compass,
  ShoppingBag,
  MessageCircle,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Bot,
  FolderKanban,
  BarChart3,
  Users,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Explore", icon: Compass, href: "/explore" },
  { label: "Marketplace", icon: ShoppingBag, href: "/marketplace" },
  { label: "Chat", icon: MessageCircle, href: "/chat" },
  { label: "Client Panel", icon: FolderKanban, href: "/client" },
  { label: "Profile", icon: User, href: "/profile" },
];

const ADMIN_ITEMS = [
  { label: "Admin", icon: BarChart3, href: "/admin" },
  { label: "Employees", icon: Users, href: "/employee" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");

  // Desktop sidebar
  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 left-0 bottom-0 z-50 w-72 bg-black/95 backdrop-blur-2xl border-r border-white/10 p-4 flex flex-col md:hidden"
          >
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-bold tracking-widest text-white/40">MENU</span>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-2 rounded-full hover:bg-white/5 transition"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => (
                  <SidebarLink key={item.href} item={item} isActive={isActive(item.href)} onClose={() => setIsMobileOpen(false)} />
                ))}
                <div className="h-px bg-white/5 my-3" />
                {ADMIN_ITEMS.map((item) => (
                  <SidebarLink key={item.href} item={item} isActive={isActive(item.href)} onClose={() => setIsMobileOpen(false)} />
                ))}
              </nav>
            </div>
            <div className="border-t border-white/5 pt-4">
              <SidebarLink
                item={{ label: "Settings", icon: Settings, href: "/settings" }}
                isActive={isActive("/settings")}
                onClose={() => setIsMobileOpen(false)}
              />
              <SidebarLink
                item={{ label: "Logout", icon: LogOut, href: "/logout" }}
                isActive={false}
                onClose={() => setIsMobileOpen(false)}
                className="text-red-400 hover:bg-red-500/10"
              />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col fixed top-14 left-0 bottom-0 z-30 bg-black/90 backdrop-blur-xl border-r border-white/5 transition-all duration-300",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex-1 overflow-y-auto py-4">
          <button
            onClick={toggleCollapse}
            className="w-full flex items-center justify-center p-2 hover:bg-white/5 transition mb-2"
          >
            <Menu className="w-5 h-5 text-white/40" />
          </button>
          <nav className="space-y-0.5 px-2">
            {NAV_ITEMS.map((item) => (
              <DesktopLink key={item.href} item={item} isActive={isActive(item.href)} collapsed={isCollapsed} />
            ))}
            <div className="h-px bg-white/5 my-2" />
            {ADMIN_ITEMS.map((item) => (
              <DesktopLink key={item.href} item={item} isActive={isActive(item.href)} collapsed={isCollapsed} />
            ))}
          </nav>
        </div>
        <div className="border-t border-white/5 p-2">
          <DesktopLink
            item={{ label: "Settings", icon: Settings, href: "/settings" }}
            isActive={isActive("/settings")}
            collapsed={isCollapsed}
          />
          <DesktopLink
            item={{ label: "Logout", icon: LogOut, href: "/logout" }}
            isActive={false}
            collapsed={isCollapsed}
            className="text-red-400 hover:bg-red-500/10"
          />
        </div>
      </aside>
    </>
  );
}

function SidebarLink({ item, isActive, onClose, className = "" }: any) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
        isActive
          ? "bg-cyan-600/20 text-cyan-400 border border-cyan-500/20"
          : "text-white/60 hover:bg-white/5 hover:text-white",
        className
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="text-sm font-medium">{item.label}</span>
    </Link>
  );
}

function DesktopLink({ item, isActive, collapsed, className = "" }: any) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
        isActive
          ? "bg-cyan-600/20 text-cyan-400 border border-cyan-500/20"
          : "text-white/60 hover:bg-white/5 hover:text-white",
        collapsed && "justify-center px-0",
        className
      )}
      title={collapsed ? item.label : undefined}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
    </Link>
  );
}

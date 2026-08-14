// src/components/layout/Navbar.tsx
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Menu } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { toggleSidebarCollapsed, toggleMobileSidebar } from "@/store/slices/uiSlice";
import { useEffect, useState } from "react";

export default function Navbar() {
  const dispatch = useDispatch();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    setIsMobile(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const handleHamburgerClick = () => {
    if (isMobile) {
      dispatch(toggleMobileSidebar());
    } else {
      dispatch(toggleSidebarCollapsed());
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 gap-4">
        {/* دکمه همبرگری – همیشه قابل مشاهده */}
        <button
          onClick={handleHamburgerClick}
          className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* بخش اعلان‌ها و پروفایل */}
        <div className="flex items-center gap-4">
          <button className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger className="relative inline-flex items-center justify-center h-8 w-8 rounded-full hover:ring-2 hover:ring-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-200 transition">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/avatar.png" alt="@username" />
                <AvatarFallback>BK</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>پروفایل</DropdownMenuItem>
              <DropdownMenuItem>تنظیمات</DropdownMenuItem>
              <DropdownMenuItem>خروج</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
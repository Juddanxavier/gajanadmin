"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Truck, 
  BarChart3, 
  Bell, 
  ChevronLeft, 
  ChevronRight,
  ShoppingBag,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface NavigationItem {
  title: string;
  href: string;
  icon: any;
  children?: {
    title: string;
    href: string;
  }[];
}

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const navigationItems: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Shipments",
    href: "/admin/shipments",
    icon: Truck,
  },
  {
    title: "Leads",
    href: "/admin/leads",
    icon: ShoppingBag,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Analytics",
    href: "/admin/shipments/analytics",
    icon: BarChart3,
  },
  {
    title: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
    children: [
        {
            title: "Overview",
            href: "/admin/notifications"
        },
        {
            title: "Email Setup",
            href: "/admin/notifications/email-setup"
        },
        {
            title: "Logs",
            href: "/admin/notifications/logs"
        },
        {
            title: "Settings",
            href: "/admin/notifications/settings"
        }
    ]
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  // State to track expanded items. Default to empty or based on current path?
  // Let's just track open states for collapsibles.
  // Ideally we might want to auto-open if a child is active.
  // For simplicity, let's keep it controlled or uncontrolled. 
  // Let's use a simple map for open states if we want multiple open, or just let Radix handle it if we don't need persistent state across navigations (though persistent is nice).
  
  // Actually, for this implementation, let's keep it simple. If we click a collapsible, it toggles.
  // We can just rely on the Collapsible component's internal state if we don't need to force it open.
  // BUT: if we navigate to a child, we probably want the parent open.
  
  // Let's derive initial open state from pathname.
  // We can't easily auto-open efficiently without some state management, but for now let's just use uncontrolled Collapsible or specific open/onOpenChange if needed.
  // However, simpler is often better. Let's use `defaultOpen` for the one that matches pathname.

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all duration-300 flex flex-col",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {!isCollapsed && (
          <div className="flex items-center gap-2 font-bold text-lg text-primary tracking-tight">
            <Truck className="h-6 w-6" />
            <span>GajanTracker</span>
          </div>
        )}
        {isCollapsed && (
          <div className="w-full flex justify-center">
            <Truck className="h-6 w-6 text-primary" />
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 px-3 py-2">
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || item.children?.some(child => pathname === child.href);
            const hasChildren = item.children && item.children.length > 0;
            
            // If collapsed, we just show the icon.
            // If it has children, maybe we show a tooltip with children? Or just link to main.
            // Current design: if collapsed, clicks usually navigate or open a popover.
            // Simplified: if collapsed, link to the main href.
            if (isCollapsed) {
              return (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground font-medium shadow-md"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="sr-only">{item.title}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="flex items-center gap-4">
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              );
            }

            // Expanded state
            if (hasChildren) {
             const isChildActive = item.children?.some(child => pathname === child.href);

              return (
                <Collapsible key={item.title} defaultOpen={isActive || isChildActive} className="group/collapsible">
                    <CollapsibleTrigger asChild>
                         <div
                            className={cn(
                            "flex items-center w-full justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer hover:bg-muted hover:text-foreground",
                            isActive && !isChildActive // Highlight parent only if exact match or if we want to show parent active for children too. Let's stick to styling trigger differently if open?
                             ? "text-foreground"
                             : "text-muted-foreground"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <Icon className="h-4 w-4" />
                                <span>{item.title}</span>
                            </div>
                            <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <div className="ml-9 mt-1 space-y-1">
                             {item.children?.map(child => {
                                 const isChildItemActive = pathname === child.href;
                                 return (
                                     <Link
                                        key={child.href}
                                        href={child.href}
                                        className={cn(
                                            "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                            isChildItemActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        )}
                                     >
                                        {child.title}
                                     </Link>
                                 )
                             })}
                        </div>
                    </CollapsibleContent>
                </Collapsible>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="border-t p-3 bg-muted/20">
         <div className="flex justify-center">
             <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className={cn(
                    "w-full text-muted-foreground hover:text-foreground",
                    isCollapsed ? "px-0" : "justify-center"
                )}
            >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
         </div>
      </div>
    </aside>
  );
}

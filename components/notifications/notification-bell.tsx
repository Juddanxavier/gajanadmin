"use client";

import { Bell, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";
import { sendTestNotification } from "@/lib/actions/notification-debug";
import { useNotifications } from "@/contexts/notification-context";

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  // Show only the latest 10 notifications in the bell
  const recentNotifications = notifications.slice(0, 10);

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    await deleteNotification(id);
  };

  const handleSendTest = async () => {
    try {
      toast.info("Sending test notification...");
      const result = await sendTestNotification();
      if (result.success) {
        toast.success("Test notification sent!");
      } else {
        toast.error("Failed to send test: " + result.error);
      }
    } catch (error: any) {
      console.error("Test notification error:", error);
      toast.error("Error sending test notification: " + (error?.message || "Unknown error"));
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative shrink-0">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-in zoom-in"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button 
                variant="ghost" 
                size="sm" 
                className="h-auto p-0 text-xs font-normal text-primary hover:underline"
                onClick={handleMarkAllAsRead}
            >
                Mark all as read
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
          ) : recentNotifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
          ) : (
            recentNotifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                className={cn(
                  "flex flex-col items-start gap-1 p-3 cursor-pointer",
                  !n.is_read && "bg-muted/50"
                )}
                onSelect={() => {
                    if (!n.is_read) handleMarkAsRead(n.id);
                }}
              >
                <div className="flex items-start justify-between w-full gap-2">
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex items-center gap-2">
                        {!n.is_read && <div className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                        <span className="font-semibold text-sm line-clamp-1">{n.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 shrink-0 transition-opacity"
                    onClick={(e) => handleDelete(e, n.id)}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
                <div className="flex items-center justify-between w-full mt-1">
                    <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </span>
                    {n.link && (
                        <Link 
                            href={n.link} 
                            className="text-[10px] text-primary hover:underline font-medium"
                            onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                        >
                            View details
                        </Link>
                    )}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer justify-center py-2 text-xs font-medium text-primary hover:bg-muted">
            <Link href="/notifications">View all notifications</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

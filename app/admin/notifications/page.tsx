"use client";

import { useState, useEffect } from "react";
import { useNotifications } from "@/contexts/notification-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, CheckCircle2, Bell, AlertCircle, Info, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { InAppNotification } from "@/lib/services/in-app-notification-service";

const TypeIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
        case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
        case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
        default: return <Info className="h-4 w-4 text-blue-500" />;
    }
};

export default function NotificationsPage() {
    const [activeTab, setActiveTab] = useState("all");
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const {
        notifications,
        isLoading,
        markAsRead,
        deleteNotification,
        markAllAsRead,
        deleteAllNotifications,
    } = useNotifications();

    // Filter notifications based on active tab
    const filteredNotifications = activeTab === 'unread' 
        ? notifications.filter(n => !n.is_read)
        : notifications;

    const handleMarkAsRead = async (id: string) => {
        await markAsRead(id);
    };

    const handleDelete = async (id: string) => {
        await deleteNotification(id);
    };

    const handleMarkAllRead = async () => {
        await markAllAsRead();
    };

    const handleDeleteAll = async () => {
        await deleteAllNotifications();
        setShowDeleteDialog(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                    <p className="text-muted-foreground">Manage your in-app notifications and alerts.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete All
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Mark all as read
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="unread">Unread</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>All Notifications</CardTitle>
                            <CardDescription>View all history of your notifications.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <NotificationList 
                                notifications={filteredNotifications} 
                                isLoading={isLoading}
                                onRead={handleMarkAsRead}
                                onDelete={handleDelete}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="unread" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Unread</CardTitle>
                            <CardDescription>New notifications that require your attention.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <NotificationList 
                                notifications={filteredNotifications} 
                                isLoading={isLoading}
                                onRead={handleMarkAsRead}
                                onDelete={handleDelete}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Delete All Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete All Notifications?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete all {notifications.length} notification{notifications.length !== 1 ? 's' : ''} from your inbox. 
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete All
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function NotificationList({ 
    notifications, 
    isLoading, 
    onRead, 
    onDelete 
}: { 
    notifications: InAppNotification[], 
    isLoading: boolean,
    onRead: (id: string) => void,
    onDelete: (id: string) => void
}) {
    if (isLoading) {
        return <div className="py-8 text-center text-muted-foreground">Loading notifications...</div>;
    }

    if (notifications.length === 0) {
        return (
            <div className="py-12 flex flex-col items-center justify-center text-center">
                <Bell className="h-12 w-12 text-muted-foreground/20 mb-4" />
                <p className="text-muted-foreground">No notifications found.</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-border">
            {notifications.map((n) => (
                <div 
                    key={n.id} 
                    className={cn(
                        "flex items-start gap-4 py-4 group transition-colors",
                        !n.is_read && "bg-muted/30 px-4 -mx-4 rounded-lg"
                    )}
                >
                    <div className="mt-1">
                        <TypeIcon type={n.type} />
                    </div>
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                            <span className={cn(
                                "text-sm font-medium",
                                !n.is_read ? "text-foreground" : "text-muted-foreground"
                            )}>
                                {n.title}
                            </span>
                            <div className="flex items-center gap-1 transition-opacity">
                                {!n.is_read && (
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onRead(n.id)}>
                                        <CheckCircle2 className="h-4 w-4" />
                                    </Button>
                                )}
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(n.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{n.message}</p>
                        <div className="flex items-center gap-4 pt-1">
                            <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                            </span>
                            {n.link && (
                                <Link 
                                    href={n.link} 
                                    className="text-xs text-primary hover:underline font-medium"
                                    onClick={() => !n.is_read && onRead(n.id)}
                                >
                                    View Details
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { initializeAdmin, getSystemStatus, fixOrphanUsers } from "./actions";
import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, RefreshCw, Users } from "lucide-react";

export default function SetupPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [systemStatus, setSystemStatus] = useState<{ authUserCount: number; assignedUserCount: number; orphanCount: number } | null>(null);

  useEffect(() => {
    loadSystemStatus();
  }, []);

  const loadSystemStatus = async () => {
    const result = await getSystemStatus();
    if (result.success) {
      setSystemStatus(result.data);
    }
  };

  const handleFixOrphans = async () => {
    setStatus("loading");
    try {
      const result = await fixOrphanUsers();
      if (result.success) {
        setStatus("success");
        setMessage(result.data?.message || "Orphans fixed");
        loadSystemStatus();
      } else {
        setStatus("error");
        setMessage(result.error || "Failed to fix orphans");
      }
    } catch (error) {
      setStatus("error");
      setMessage("An unexpected error occurred");
    }
  };

  const handleInitialize = async () => {
    setStatus("loading");
    try {
      const result = await initializeAdmin();
      if (result.success) {
        setStatus("success");
        setMessage("Successfully granted Admin permissions. You can now access the User Management page.");
      } else {
        setStatus("error");
        setMessage(result.error || "Failed to initialize admin");
      }
    } catch (error) {
      setStatus("error");
      setMessage("An unexpected error occurred");
      console.error(error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Setup</CardTitle>
          <CardDescription>
            Initialize your account with Admin privileges and default Tenant access.
            This is required for the first user to access the system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "success" && (
            <Alert variant="default" className="border-green-500 bg-green-50 text-green-900">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {status === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <Button 
            className="w-full" 
            onClick={handleInitialize} 
            disabled={status === "loading" || status === "success"}
          >
            {status === "loading" ? "Processing..." : "Initialize Admin Access (Current User)"}
          </Button>

          {systemStatus && (
            <div className="mt-6 pt-6 border-t space-y-4">
               <h3 className="font-medium flex items-center gap-2">
                 <Users className="h-4 w-4" />
                 System Status
               </h3>
               <div className="grid grid-cols-2 gap-2 text-sm">
                 <div className="text-muted-foreground">Total Auth Users:</div>
                 <div className="font-mono">{systemStatus.authUserCount}</div>
                 <div className="text-muted-foreground">Assigned Users:</div>
                 <div className="font-mono">{systemStatus.assignedUserCount}</div>
                 <div className="text-muted-foreground">Orphan Users:</div>
                 <div className="font-mono text-amber-500 font-bold">{systemStatus.orphanCount}</div>
               </div>

               {systemStatus.orphanCount > 0 && (
                 <Button 
                   variant="secondary" 
                   className="w-full"
                   onClick={handleFixOrphans}
                   disabled={status === "loading"}
                 >
                   <RefreshCw className="mr-2 h-4 w-4" />
                   Fix {systemStatus.orphanCount} Orphan Users
                 </Button>
               )}
            </div>
          )}

          {status === "success" && (
            <Button variant="outline" className="w-full" asChild>
              <a href="/admin/users">Go to User Management</a>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

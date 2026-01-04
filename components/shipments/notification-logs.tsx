
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Mail, MessageSquare, AlertCircle, CheckCircle2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NotificationLog {
  id: string;
  type: 'email' | 'sms';
  recipient: string;
  subject: string;
  status: 'sent' | 'failed';
  error_message?: string;
  sent_at?: string;
  created_at: string;
}

interface NotificationLogsProps {
  logs: NotificationLog[];
}

export function NotificationLogs({ logs }: NotificationLogsProps) {
  if (!logs || logs.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>History of alerts sent to customer</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center py-6 text-muted-foreground text-sm">
                    No notifications sent yet.
                </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>History of alerts sent to customer</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 p-3 rounded-lg border bg-card/50">
                <div className={`mt-0.5 p-2 rounded-full ${
                    log.type === 'email' ? 'bg-primary/10 text-primary' : 'bg-secondary/20 text-secondary-foreground'
                }`}>
                  {log.type === 'email' ? <Mail className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium leading-none">
                      {log.subject || (log.type === 'email' ? 'Email Notification' : 'SMS Notification')}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(log.created_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    To: {log.recipient}
                  </p>
                  
                  {log.status === 'failed' && (
                      <p className="text-xs text-destructive mt-1">
                          Error: {log.error_message}
                      </p>
                  )}
                </div>

                <div className="mt-0.5">
                    {log.status === 'sent' ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

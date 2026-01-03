"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, KeyRound, ArrowRight, ArrowLeft } from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Rate Limiting / Countdown
  const [countdown, setCountdown] = useState(0);

  const router = useRouter();

  // Timer Effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Password Login Handler
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      router.push("/dashboard");
      router.refresh();
    } catch (error: any) {
      setError(error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // OTP Login Handler
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (countdown > 0) return;

    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        }
      });

      if (error) {
        if (error.status === 429) {
          setCountdown(60); // Start 60s cooldown on rate limit
          throw new Error("Too many requests. Please try again in 60 seconds.");
        }
        throw error;
      }
      
      setIsOtpSent(true);
      setCountdown(60); // Start cooldown after successful send too
    } catch (error: any) {
      setError(error.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'email',
      });

      if (error) throw error;
      
      router.push("/dashboard");
      router.refresh();
    } catch (error: any) {
      setError(error.message || "Invalid code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Access your admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="password" onValueChange={() => setError(null)}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="otp">Email OTP</TabsTrigger>
            </TabsList>

            {/* PASSWORD TAB */}
            <TabsContent value="password">
              <form onSubmit={handlePasswordLogin}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center">
                      <Label htmlFor="password">Password</Label>
                      <Link
                        href="/auth/forgot-password"
                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                      >
                        Forgot your password?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            {/* OTP TAB */}
            <TabsContent value="otp">
               {!isOtpSent ? (
                /* Step 1: Send Code */
                <form onSubmit={handleSendOtp}>
                  <div className="flex flex-col gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="otp-email">Email</Label>
                      <Input
                        id="otp-email"
                        type="email"
                        placeholder="m@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
                    <Button type="submit" className="w-full" disabled={isLoading || countdown > 0}>
                       {countdown > 0 ? `Resend in ${countdown}s` : (isLoading ? "Sending..." : "Send Login Code")}
                       {!isLoading && countdown === 0 && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                  </div>
                </form>
               ) : (
                /* Step 2: Verify Code */
                <form onSubmit={handleVerifyOtp}>
                   <div className="flex flex-col gap-6">
                    <div className="grid gap-2 justify-center">
                       <div className="flex items-center justify-between w-full mb-2">
                        <Label htmlFor="otp-code">Enter 6-digit Code</Label>
                       </div>
                       
                       <div className="flex justify-center">
                         <InputOTP 
                            maxLength={6} 
                            value={otpCode} 
                            onChange={(value) => setOtpCode(value)}
                          >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                       </div>

                      <p className="text-xs text-muted-foreground text-center mt-2">
                        We sent a code to <strong>{email}</strong>
                      </p>
                    </div>
                    {error && <p className="text-sm text-red-500 font-medium text-center">{error}</p>}
                    
                    <Button type="submit" className="w-full" disabled={isLoading || otpCode.length !== 6}>
                      {isLoading ? "Verifying..." : "Verify & Login"}
                    </Button>
                    
                    <div className="flex justify-between items-center mt-2">
                       <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setIsOtpSent(false)}
                        disabled={isLoading}
                        className="text-xs"
                      >
                        <ArrowLeft className="mr-2 h-3 w-3" /> Change Email
                      </Button>
                      
                       <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={handleSendOtp}
                        disabled={isLoading || countdown > 0}
                        className="text-xs text-muted-foreground hover:text-primary"
                      >
                        {countdown > 0 ? `Resend in ${countdown}s` : "Resend Code"}
                      </Button>
                    </div>

                  </div>
                </form>
               )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

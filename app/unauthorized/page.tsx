
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldAlert } from "lucide-react"
import Link from "next/link"

export default function UnauthorizedPage() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border bg-card shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-destructive/10 text-destructive animate-in zoom-in duration-500">
              <ShieldAlert className="w-12 h-12" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Unauthorized Access</CardTitle>
          <CardDescription className="text-muted-foreground mt-2 text-base">
            You do not have permission to access this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p>
            Please check your credentials or contact your administrator if you believe this is an error.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-center w-full">
          <Button asChild variant="default" className="w-full sm:w-auto">
            <Link href="/login">
              Return to Login
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/">
              Go Home
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

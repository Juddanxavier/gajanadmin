import { LoginForm } from "@/components/login-form";
import { redirect } from "next/navigation";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  if (params.error === "unauthorized") {
    redirect("/unauthorized");
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-muted/30">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}

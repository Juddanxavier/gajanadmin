/** @format */

import { checkAdminAccess } from './auth-check';
import { DashboardLayout } from './dashboard-layout';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side check - redirects if not authorized
  await checkAdminAccess();

  return <DashboardLayout>{children}</DashboardLayout>;
}

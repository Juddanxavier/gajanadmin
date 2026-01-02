"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { UserStats } from "@/lib/types";

interface UserChartsProps {
  stats: UserStats;
}

const ROLE_COLORS = {
  admin: "#ef4444",
  staff: "#3b82f6",
  customer: "#8b5cf6",
};

export function UserCharts({ stats }: UserChartsProps) {
  // Prepare role distribution data
  const roleData = [
    { name: "Admin", value: stats.byRole.admin, color: ROLE_COLORS.admin },
    { name: "Staff", value: stats.byRole.staff, color: ROLE_COLORS.staff },
    { name: "Customer", value: stats.byRole.customer, color: ROLE_COLORS.customer },
  ].filter((item) => item.value > 0);

  // Prepare tenant distribution data
  const tenantData = Object.entries(stats.byTenant).map(([name, count]) => ({
    name,
    count,
  }));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Role Distribution Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Role Distribution</CardTitle>
          <CardDescription>Users by role type</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={roleData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: any) =>
                  `${props.name}: ${((props.percent || 0) * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {roleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tenant Distribution Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Tenant Distribution</CardTitle>
          <CardDescription>Users by tenant</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tenantData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

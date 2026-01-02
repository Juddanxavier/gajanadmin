"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Shield, Building2 } from "lucide-react";
import { UserStats } from "@/lib/types";
import { motion } from "framer-motion";

interface UserStatsCardsProps {
  stats: UserStats;
}

export function UserStatsCards({ stats }: UserStatsCardsProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats.total.toString(),
      description: "All registered users",
      icon: Users,
    },
    {
      title: "Active Users",
      value: stats.active.toString(),
      description: "Signed in last 30 days",
      icon: UserCheck,
    },
    {
      title: "Admins",
      value: stats.byRole.admin.toString(),
      description: `${stats.byRole.staff} staff, ${stats.byRole.customer} customers`,
      icon: Shield,
    },
    {
      title: "By Tenant",
      value: Object.keys(stats.byTenant).length.toString(),
      description: "Active tenants",
      icon: Building2,
    },
  ];

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
    >
      {statCards.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div key={stat.title} variants={item}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

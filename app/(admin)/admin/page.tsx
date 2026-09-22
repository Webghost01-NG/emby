"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, BookOpen, CreditCard, Presentation, BarChart3 } from "lucide-react";

type AnalyticsData = {
  total_users: number;
  total_premium_users: number;
  total_classes: number;
  total_subjects: number;
  total_slides: number;
  total_quizzes_taken: number;
  revenue_summary: { monthly: number; yearly: number };
};

export default function AdminDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const analytics = await adminApi.getAnalytics();
        setData(analytics);
      } catch (err: any) {
        setError(err.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error! </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  const statCards = [
    { title: "Total Users", value: data.total_users, icon: Users, desc: `${data.total_premium_users} premium users` },
    { title: "Active Classes", value: data.total_classes, icon: BookOpen, desc: "Created across all schools" },
    { title: "Content Slides", value: data.total_slides, icon: Presentation, desc: `Across ${data.total_subjects} subjects` },
    { title: "Revenue", value: `₦${(data.revenue_summary.monthly / 1000).toFixed(1)}k`, icon: CreditCard, desc: "From premium subscriptions" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500 mt-1">Welcome back. Here is what's happening with the platform.</p>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                {stat.desc}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
            <CardDescription>Monthly subscription revenue over time.</CardDescription>
          </CardHeader>
          <CardContent className="h-80 flex flex-col items-center justify-center text-center">
            <BarChart3 className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">Revenue chart data will appear here once the backend provides time-series analytics.</p>
            <p className="text-xs text-gray-400 mt-1">Current monthly: ₦{(data.revenue_summary.monthly / 1000).toFixed(1)}k</p>
          </CardContent>
        </Card>

        {/* User Growth Chart */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>New registrations over the past month.</CardDescription>
          </CardHeader>
          <CardContent className="h-80 flex flex-col items-center justify-center text-center">
            <BarChart3 className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">User growth chart data will appear here once the backend provides time-series analytics.</p>
            <p className="text-xs text-gray-400 mt-1">Current total: {data.total_users} users</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

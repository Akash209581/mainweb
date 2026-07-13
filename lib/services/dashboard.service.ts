import { getDashboardMetrics, getAdminDashboardStats } from "@/lib/repositories/dashboard.repository";

export async function getAdminDashboardMetrics() {
  return getDashboardMetrics();
}

export async function getAdminStats() {
  return getAdminDashboardStats();
}

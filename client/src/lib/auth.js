export function getDashboardPath(role) {
  return role === "admin" ? "/admin/dashboard" : "/dashboard";
}

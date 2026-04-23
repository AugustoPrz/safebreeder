import { supabaseBrowser } from "./browser";

export interface AdminUserRow {
  id: string;
  email: string | null;
  name: string | null;
  plan: string;
  role: string | null;
  created_at: string;
  est_count: number;
  lot_count: number;
}

export interface AdminStats {
  totals: {
    users: number;
    establishments: number;
    lots: number;
  };
  users: AdminUserRow[];
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const sb = supabaseBrowser();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (sb as any).rpc("get_admin_stats");
  if (error) throw new Error(error.message);
  return data as AdminStats;
}

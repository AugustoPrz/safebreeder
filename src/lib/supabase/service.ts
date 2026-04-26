import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client backed by the service-role key.
 *
 * IMPORTANT: never import this from a client component or expose the key
 * to the browser. The `server-only` import causes the bundler to throw
 * if any client code tries to pull this in.
 */
export function supabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

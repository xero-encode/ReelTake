import { supabase } from "@/integrations/supabase/client";
import type { Venue } from "@/lib/db/types";

export async function listVenues(): Promise<Venue[]> {
  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data ?? []) as Venue[];
}

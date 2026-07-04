import { supabase } from "@/integrations/supabase/client";
import type { Title } from "@/lib/db/types";

export async function listTitles(): Promise<Title[]> {
  const { data, error } = await supabase
    .from("titles")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data ?? []) as Title[];
}

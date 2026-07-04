import { supabase } from "@/integrations/supabase/client";
import type { Deal, Title, Venue } from "@/lib/db/types";

export interface DealWithRefs extends Deal {
  title: Pick<Title, "id" | "name" | "poster_url"> | null;
  venue: Pick<Venue, "id" | "name"> | null;
}

export async function listDeals(): Promise<DealWithRefs[]> {
  const { data, error } = await supabase
    .from("deals")
    .select(
      `id, venue_id, title_id, split_percentage, valid_from, valid_to, created_at,
       title:titles(id, name, poster_url),
       venue:venues(id, name)`,
    )
    .order("valid_from", { ascending: false });
  if (error) throw error;
  return data as unknown as DealWithRefs[];
}

export interface NewDealInput {
  title_id: string;
  venue_id: string | null;
  split_percentage: number;
  valid_from: string;
  valid_to: string | null;
}

export async function createDeal(input: NewDealInput): Promise<void> {
  const { error } = await supabase.from("deals").insert(input);
  if (error) throw error;
}

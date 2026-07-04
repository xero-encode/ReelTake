import { supabase } from "@/integrations/supabase/client";
import type {
  BoxOfficeLine,
  Deal,
  Exhibitor,
  Statement,
  Title,
  Venue,
} from "@/lib/db/types";

export interface StatementListItem extends Statement {
  title: Pick<Title, "id" | "name" | "poster_url"> | null;
  exhibitor: Pick<Exhibitor, "id" | "name"> | null;
  totalGross: number;
}

export async function listStatementsWithTotals(): Promise<StatementListItem[]> {
  const { data, error } = await supabase
    .from("statements")
    .select(
      `id, title_id, exhibitor_id, file_url, raw_extracted_json,
       period_start, period_end, status, created_at,
       title:titles(id, name, poster_url),
       exhibitor:exhibitors(id, name),
       box_office_lines(gross_amount)`,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  type Row = Omit<StatementListItem, "totalGross" | "title" | "exhibitor"> & {
    title: StatementListItem["title"];
    exhibitor: StatementListItem["exhibitor"];
    box_office_lines: { gross_amount: number | null }[] | null;
  };
  return (data as unknown as Row[]).map((row) => {
    const totalGross = (row.box_office_lines ?? []).reduce(
      (acc, l) => acc + (l.gross_amount ?? 0),
      0,
    );
    const { box_office_lines: _drop, ...rest } = row;
    void _drop;
    return { ...rest, totalGross };
  });
}

export interface LineWithDeal extends BoxOfficeLine {
  venue: Pick<Venue, "id" | "name"> | null;
  deal: Pick<Deal, "id" | "split_percentage"> | null;
}

export interface StatementDetail extends Statement {
  title: Title | null;
  exhibitor: Exhibitor | null;
  box_office_lines: LineWithDeal[];
}

export async function getStatement(id: string): Promise<StatementDetail | null> {
  const { data, error } = await supabase
    .from("statements")
    .select(
      `id, title_id, exhibitor_id, file_url, raw_extracted_json,
       period_start, period_end, status, created_at,
       title:titles(*),
       exhibitor:exhibitors(*),
       box_office_lines(
         id, statement_id, venue_id, play_date, screen, format,
         ticket_type, admissions, gross_amount, deal_id, created_at,
         venue:venues(id, name),
         deal:deals(id, split_percentage)
       )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  const detail = data as unknown as StatementDetail;
  // Sort lines by play_date for a stable view.
  detail.box_office_lines = [...detail.box_office_lines].sort((a, b) => {
    if (!a.play_date) return 1;
    if (!b.play_date) return -1;
    return a.play_date.localeCompare(b.play_date);
  });
  return detail;
}

export async function markStatementReviewed(id: string): Promise<void> {
  const { error } = await supabase
    .from("statements")
    .update({ status: "reviewed" })
    .eq("id", id);
  if (error) throw error;
}

// Hand-written types matching the live Supabase schema.
// Do not add fields that don't exist in the DB.

export type StatementStatus =
  | "received"
  | "parsed"
  | "reviewed"
  | "invoiced"
  | "paid"
  | "failed";

export type TicketType = "Adult" | "Child" | "Senior" | "Student";

export interface Exhibitor {
  id: string;
  name: string;
  channel: string | null;
  xero_contact_id: string | null;
  email: string | null;
  created_at: string;
}

export interface Title {
  id: string;
  name: string;
  poster_url: string | null;
  created_at: string;
}

export interface Venue {
  id: string;
  exhibitor_id: string;
  name: string;
  location: string | null;
  created_at: string;
}

export interface Deal {
  id: string;
  venue_id: string | null;
  title_id: string;
  split_percentage: number;
  valid_from: string;
  valid_to: string | null;
  created_at: string;
}

export interface Statement {
  id: string;
  exhibitor_id: string | null;
  file_url: string | null;
  raw_extracted_json: unknown;
  fx_rate_applied: number | null;
  period_start: string | null;
  period_end: string | null;
  status: StatementStatus | string;
  created_at: string;
}

export interface BoxOfficeLine {
  id: string;
  statement_id: string;
  play_date: string | null;
  screen: string | null;
  format: string | null;
  ticket_type: TicketType | null;
  admissions: number | null;
  gross_amount: number | null;
  deal_id: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  statement_id: string;
  exhibitor_id: string;
  xero_invoice_id: string | null;
  amount: number;
  xero_status: string | null;
  created_at: string;
}

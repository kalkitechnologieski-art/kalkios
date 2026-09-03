export function generateCSV(leads: any[]): string {
  if (!leads.length) return "No leads found.";
  const headers = ["Name", "Email", "Phone", "Company", "Job Title", "Source URL", "Confidence"];
  const rows = leads.map(l => [
    l.name || "",
    l.email || "",
    l.phone || "",
    l.company || "",
    l.job_title || "",
    l.source_url || "",
    `${Math.round(l.confidence * 100)}%`,
  ]);
  const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
  return "\uFEFF" + csv;
}


"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminErrorsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("ai_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      setLogs(data || []);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  if (loading) return <div className="text-white/40 text-center py-20">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-4">AI Error Logs</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-white/70">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="p-2 text-left">Time</th>
              <th className="p-2 text-left">User</th>
              <th className="p-2 text-left">Action</th>
              <th className="p-2 text-left">Provider</th>
              <th className="p-2 text-left">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-white/5">
                <td className="p-2">{new Date(log.created_at).toLocaleString()}</td>
                <td className="p-2">{log.user_id || "anonymous"}</td>
                <td className="p-2">{log.action}</td>
                <td className="p-2">{log.provider}</td>
                <td className="p-2 max-w-xs truncate">{JSON.stringify(log.details)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


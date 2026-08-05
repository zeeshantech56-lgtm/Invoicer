"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from "recharts";

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 shadow-xl text-sm">
      <p className="text-slate-500 text-xs mb-1">{label}</p>
      <p className="font-bold text-slate-900">₹{Number(payload[0]?.value || 0).toFixed(2)}</p>
    </div>
  );
}

export default function DashboardChart({ data, filter }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="#F1F5F9" />
        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize:11, fill:"#94A3B8", fontWeight:500 }} dy={6}
          interval={filter==="30d" ? 4 : 0} angle={filter==="30d" ? -35 : 0}
          textAnchor={filter==="30d" ? "end" : "middle"} height={filter==="30d" ? 40 : 22} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize:11, fill:"#94A3B8" }} tickFormatter={v => `₹${v}`} />
        <RechartsTooltip content={<ChartTooltip />} cursor={{ fill:"#F8FAFF", rx:6 }} />
        <Bar dataKey="total" fill="#6366F1" radius={[6,6,0,0]} barSize={filter==="30d"?9:(filter==="6m"?36:22)} />
      </BarChart>
    </ResponsiveContainer>
  );
}

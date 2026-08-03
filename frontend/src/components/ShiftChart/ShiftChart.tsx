import {
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LineChart,
  Line,
} from "recharts";
import { aggregateWorkedHoursByDay } from "@/utils/format";
import type { Shift } from "@/types/shift";

export function ShiftChart({ shifts }: { shifts: Shift[] }) {
  const data = aggregateWorkedHoursByDay(shifts);

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-ink-soft">
        No shift data to chart yet
      </p>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-line)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "var(--color-ink-soft)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--color-line)" }}
            padding={{ left: 10, right: 10 }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "var(--color-ink-soft)" }}
            tickLine={false}
            axisLine={false}
            width={30}
            allowDecimals={false}
            label={{
              value: "hours",
              position: "top",
              offset: 12,
              fontSize: 11,
              fill: "var(--color-ink-soft)",
            }}
          />
          <Tooltip
            cursor={{ stroke: "var(--color-line)", strokeWidth: 1 }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--color-line)",
              backgroundColor: "var(--color-card)",
              color: "var(--color-ink)",
              fontSize: 13,
            }}
            formatter={(value) => [`${Number(value ?? 0)} hrs`, "Worked"]}
          />
          <Line
            type="monotone"
            dataKey="hours"
            stroke="var(--color-brand)"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "var(--color-brand)", strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

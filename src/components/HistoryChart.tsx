import { useMemo } from 'react'
import { CartesianGrid, Label, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { compass, type Observation } from '../lib/explorer'
import { prepareHistory, seriesKey } from '../lib/history-chart'

const colors = ['#2563eb', '#16a34a', '#f59e0b']
const seriesName = (depth: number | null) => depth === null ? 'Surface' : `${depth} m`

export function HistoryChart({ rows, direction, unit, range, label }: { rows: Observation[]; direction?: string; unit: string; range: string; label: string }) {
  const chart = useMemo(() => prepareHistory(rows), [rows])
  if (!chart.points.length) return <p>No observations in this range.</p>
  const displayUnit = unit === '1' ? 'relative' : unit
  const tick = (time: number) => new Intl.DateTimeFormat(undefined, range === '24h'
    ? { hour: '2-digit', minute: '2-digit', hour12: false }
    : { month: 'short', day: 'numeric' }).format(time)
  return <div className="history-chart-shell" role="img" aria-label={`${label} historical observations in ${displayUnit}; exact values are available in the table below`}>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chart.points} margin={{ top: 20, right: 20, left: 4, bottom: 12 }}>
        <CartesianGrid stroke="#dce6eb" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="time" type="number" domain={['dataMin', 'dataMax']} tickFormatter={tick} minTickGap={48} tick={{ fontSize: 11, fill: '#52646f' }} tickLine={false} axisLine={{ stroke: '#cbd8e1' }} height={54}>
          <Label value="Timeline" position="insideBottom" offset={0} style={{ fontSize: 12, fontWeight: 600, fill: '#52646f' }} />
        </XAxis>
        <YAxis width={58} domain={direction ? [0, 360] : ['auto', 'auto']} tickFormatter={(value: number) => Number(value.toFixed(2)).toString()} tick={{ fontSize: 11, fill: '#52646f' }} tickLine={false} axisLine={false} />
        <Tooltip labelFormatter={value => new Date(Number(value)).toLocaleString(undefined, { hour12: false })} formatter={(value) => typeof value === 'number' ? direction ? `${compass(value)} (${value.toFixed(1)}° ${direction.toUpperCase()})` : `${value.toFixed(2)} ${displayUnit}` : 'No reading'} contentStyle={{ border: '1px solid #dce6eb', borderRadius: 8, background: '#fff', fontSize: 13 }} />
        <Legend verticalAlign="top" align="left" iconType="circle" wrapperStyle={{ fontSize: 12, paddingBottom: 12 }} />
        {chart.depths.map((depth, index) => <Line key={seriesKey(depth)} type="monotone" dataKey={seriesKey(depth)} name={seriesName(depth)} stroke={colors[index % colors.length]} strokeWidth={direction ? 0 : 2} dot={direction ? { r: 2, strokeWidth: 0, fill: colors[index % colors.length] } : false} activeDot={{ r: 4 }} connectNulls={false} isAnimationActive={false} />)}
      </LineChart>
    </ResponsiveContainer>
  </div>
}

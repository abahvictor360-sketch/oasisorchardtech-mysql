import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#1bb0ce', '#ef4444'];

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2">
      <p className="text-xs text-gray-500 mb-0.5">{name}</p>
      <p className="text-sm font-bold text-[#0a1628]">{value.toLocaleString()}</p>
    </div>
  );
}

function CenterLabel({ viewBox }) {
  const { cx, cy } = viewBox;
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={cx} dy="-0.4em" fontSize="11" fill="#6b7280" fontWeight="500">
        Sales
      </tspan>
      <tspan x={cx} dy="1.4em" fontSize="16" fill="#0a1628" fontWeight="700">
        Total
      </tspan>
    </text>
  );
}

export default function CategoryDoughnut({ data = [] }) {
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
          {/* Center label via labelLine prop disabled, use customized label */}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
          iconType="circle"
          iconSize={10}
        />
        {/* Render center label as a separate Pie with a label */}
        <Pie
          data={[{ value: 1 }]}
          dataKey="value"
          cx="50%"
          cy="45%"
          innerRadius={0}
          outerRadius={0}
          label={({ cx, cy }) => (
            <g>
              <text
                x={cx}
                y={cy - 7}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={11}
                fill="#6b7280"
                fontWeight="500"
              >
                Sales
              </text>
              <text
                x={cx}
                y={cy + 12}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={16}
                fill="#0a1628"
                fontWeight="700"
              >
                {total.toLocaleString()}
              </text>
            </g>
          )}
          labelLine={false}
          isAnimationActive={false}
        >
          <Cell fill="transparent" />
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

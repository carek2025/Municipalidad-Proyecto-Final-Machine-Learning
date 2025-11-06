import React from 'react'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

const ChartContainer = ({ title, data, type = 'bar', height = 300 }) => {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="_id" 
          angle={-45}
          textAnchor="end"
          height={80}
          tick={{ fontSize: 12 }}
        />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="count" fill="#8884d8" name="Total" />
        <Bar dataKey="completados" fill="#82ca9d" name="Completados" />
      </BarChart>
    </ResponsiveContainer>
  )

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ _id, count }) => `${_id}: ${count}`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="count"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {type === 'bar' ? renderBarChart() : renderPieChart()}
    </div>
  )
}

export default ChartContainer
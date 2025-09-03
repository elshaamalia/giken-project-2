import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomLineChart = ({ data }) => {
  // Hanya ambil 15 data terakhir untuk ditampilkan di grafik agar tidak terlalu padat
  const chartData = data.slice(-15);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm h-[445px] -mt-3">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Individual Process Graph</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: -10, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="start_time" 
            angle={-45} 
            textAnchor="end" 
            height={60} 
            tick={{ fontSize: 12, fill: '#6B7280' }}
            interval="preserveStartEnd"
          />
          <YAxis 
            domain={[0, 60]} 
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickCount={11} // <-- Diubah menjadi 11
            // Opsional: tambahkan interval agar label tidak menumpuk jika terlalu rapat
            interval={0} 
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd' }}
            labelStyle={{ color: '#333', fontWeight: 'bold' }}
          />
          <Legend wrapperStyle={{ paddingTop: '' }}/>
          <Line type="monotone" dataKey="screw" name="Screw" stroke="#EF4444" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="function" name="Function" stroke="#3B82F6" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="label" name="Label" stroke="#10B981" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CustomLineChart;
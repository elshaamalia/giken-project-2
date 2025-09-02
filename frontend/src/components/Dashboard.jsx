import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Header from '../components/Header';
import StatusCard from '../components/StatusCard';
import CustomLineChart from '../components/LineChart';
import CycleTable from '../components/CycleTable';

const SERVER_URL = 'http://localhost:3002';

const Dashboard = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [cycleHistory, setCycleHistory] = useState([]);
  
  // --- PERBAIKAN 1: Kita gunakan satu state saja untuk semua statistik kartu ---
  const [stats, setStats] = useState({
    total_parts: 0,
    completed_parts: 0,
  });

  useEffect(() => {
    const socket = io(SERVER_URL);

    socket.on('connect', () => {
      console.log('✅ Terhubung ke server via Socket.IO');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Terputus dari server Socket.IO');
      setIsConnected(false);
    });

    // Mengambil data awal
    socket.on('initial-data', (data) => {
      console.log('📥 Menerima data awal:', data);
      setCycleHistory(data.recentData || []);
      setChartData(data.chartData || []);
      
      // --- PERBAIKAN 2: Isi state stats dengan data awal dari server ---
      if (data.stats) {
        setStats(data.stats);
      }
    });
    
    // Mengambil update tabel realtime
    socket.on('realtime-update', (newData) => {
      console.log('🔄 Menerima update real-time:', newData);
      setCycleHistory(prevHistory => {
        const existingIndex = prevHistory.findIndex(item => item.id === newData.id);
        let updatedHistory;
        if (existingIndex !== -1) {
          updatedHistory = [...prevHistory];
          updatedHistory[existingIndex] = newData;
        } else {
          updatedHistory = [newData, ...prevHistory].slice(0, 5);
        }
        // Pastikan data selalu terurut dari yang terbaru
        return updatedHistory.sort((a, b) => b.id - a.id);
      });

      if (newData.status === 'Finish') {
        const newChartEntry = {
          start_time: newData.start_time,
          screw: newData.screw,
          function: newData.function,
          label: newData.label,
        };
        setChartData(prevData => [...prevData, newChartEntry].slice(-10));
      }
    });

    // Mengambil update statistik realtime
    socket.on('stats-update', (updatedStats) => {
      console.log('📊 Menerima stats-update:', updatedStats);
      // --- PERBAIKAN 3: Update state stats dengan data terbaru ---
      setStats(updatedStats);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <>
      <Header isConnected={isConnected} />
      <main className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 grid-rows-4 gap-6">
          <div className="lg:col-span-3 lg:row-span-4">
            <CustomLineChart data={chartData} />
          </div>
          
          {/* --- PERBAIKAN 4: Tampilkan data dari state 'stats' yang sudah benar --- */}
          <StatusCard title="SCREW" value={stats.total_parts || 0} />
          <StatusCard title="FUNCTION" value={stats.completed_parts || 0} />
          <StatusCard title="LABEL" value={stats.completed_parts || 0} />
          <StatusCard title="FINAL OUTPUT" value={stats.completed_parts || 0} />
        </div>
        
        <CycleTable data={cycleHistory} />
      </main>
    </>
  );
};

export default Dashboard;
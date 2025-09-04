import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import io from 'socket.io-client';
import { subDays, startOfDay, isWithinInterval, parseISO, subMonths, startOfMonth, endOfMonth } from 'date-fns';

const SERVER_URL = 'http://localhost:3002';

// --- Ikon-ikon komponen ---
const ChartBarIcon = () => ( <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0h6m6 0v-4a2 2 0 00-2-2h-2a2 2 0 00-2 2v4a2 2 0 002 2h2a2 2 0 002-2z"></path></svg> );
const ExportIcon = () => ( <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z"></path><path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z"></path></svg> );
const BackArrowIcon = () => ( <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg> );


const History = () => {
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const [timeFilter, setTimeFilter] = useState('Today');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const socket = io(SERVER_URL);

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('request-all-data');
    });

    socket.on('all-data', (data) => {
      const sortedData = data.sort((a, b) => b.id - a.id);
      setAllData(sortedData);
      setLoading(false);
      socket.disconnect();
    });

    socket.on('connect_error', (err) => {
      setIsConnected(false);
      setError(`Gagal terhubung ke server: ${err.message}. Pastikan backend berjalan.`);
      setLoading(false);
    });
    
    return () => socket.disconnect();
  }, []);


  const filteredData = useMemo(() => {
    let result = allData;
    const now = new Date();

    if (timeFilter !== 'All Time') {
      let interval;
      if (timeFilter === 'Today') {
        interval = { start: startOfDay(now), end: now };
      } else if (timeFilter === 'Last 7 Days') {
        interval = { start: startOfDay(subDays(now, 7)), end: now };
      } else if (timeFilter === 'This Month') {
        interval = { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
      } else if (timeFilter === 'Last Month') {
        const lastMonthDate = subMonths(now, 1);
        interval = { start: startOfMonth(lastMonthDate), end: endOfMonth(lastMonthDate) };
      }
      
      if (interval) {
        result = result.filter(item => {
          const itemDate = item.created_at ? parseISO(item.created_at) : null;
          return itemDate && isWithinInterval(itemDate, interval);
        });
      }
    }
    
    if (searchTerm) {
      result = result.filter(item => 
        item.output_no && item.output_no.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return result;
  }, [allData, timeFilter, searchTerm]);

  const exportToCSV = () => {
    if (filteredData.length === 0) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }
    // --- PERUBAHAN 1: Tambahkan 'label' ke headers ---
    const headers = ['id', 'start_time', 'screw', 'function', 'label', 'end_time', 'cycle_time', 'status', 'output_no', 'last_updated', 'created_at'];
    let csvContent = headers.join(",") + "\n";
    
    filteredData.forEach(item => {
      const row = headers.map(header => {
        let cell = item[header] === null || item[header] === undefined ? '' : item[header];
        if (typeof cell === 'string' && cell.includes(',')) {
          cell = `"${cell}"`;
        }
        return cell;
      });
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const filename = `export_data_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="p-6 md:p-10 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link 
            to="/" 
            className="inline-flex items-center px-3 py-1 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 font-semibold mb-3"
          >
            <BackArrowIcon />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">All Cycle Data</h1>
          <p className="text-gray-500">Complete production monitoring history</p>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <div className="flex items-center space-x-2 mr-4">
            <div className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>{isConnected ? 'Live' : 'Disconnected'}</span>
          </div>
          <span>{new Date().toLocaleString('id-ID')}</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white border rounded-lg p-4 flex items-center">
            <ChartBarIcon />
            <div className="ml-4">
              <p className="text-gray-500">Total Records</p>
              <p className="text-2xl font-bold">{loading ? '...' : filteredData.length}</p>
            </div>
          </div>
          <div className="md:col-span-2 flex items-center justify-end space-x-4">
            <select className="bg-white border rounded-md p-2 text-sm" value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}>
              <option>Today</option>
              <option>Last 7 Days</option>
              <option>This Month</option>
              <option>Last Month</option>
              <option>All Time</option>
            </select>
            <input 
              type="text" 
              placeholder="Search by Output No..." 
              className="bg-white border rounded-md p-2 text-sm w-48" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
            <button onClick={exportToCSV} className="bg-green-500 text-white text-sm font-semibold px-4 py-2 rounded-md flex items-center hover:bg-green-600">
              <ExportIcon />
              Export CSV
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-base text-gray-500 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">No</th>
                <th className="px-6 py-3">Start Time</th>
                <th className="px-6 py-3">End Time</th>
                <th className="px-6 py-3">Screw</th>
                <th className="px-6 py-3">Function</th>
                <th className="px-6 py-3">Label</th>
                <th className="px-6 py-3">Cycle Time</th>
                <th className="px-6 py-3">Output No</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {loading && <tr><td colSpan="9" className="text-center p-6 text-gray-500">Memuat data histori...</td></tr>}
              {error && <tr><td colSpan="9" className="text-center p-6 text-red-500">{error}</td></tr>}
              {!loading && !error && filteredData.map((item, index) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{index + 1}</td>
                  <td className="px-6 py-4">{item.start_time}</td>
                  <td className="px-6 py-4">{item.end_time || '-'}</td>
                  <td className="px-6 py-4">{item.screw ? parseFloat(item.screw).toFixed(2) + 's' : '-'}</td>
                  <td className="px-6 py-4">{item.function ? parseFloat(item.function).toFixed(2) + 's' : '-'}</td>
                  <td className="px-6 py-4">{item.label ? parseFloat(item.label).toFixed(2) + 's' : '-'}</td>
                  <td className="px-6 py-4">{item.cycle_time ? parseFloat(item.cycle_time).toFixed(2) + 's' : '-'}</td>
                  <td className="px-6 py-4">{item.output_no || '-'}</td>
                  <td className="px-6 py-4">{item.status || '-'}</td>
                </tr>
              ))}
              {!loading && !error && filteredData.length === 0 && (
                <tr><td colSpan="9" className="text-center p-6 text-gray-500">Tidak ada data yang cocok dengan filter Anda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default History;
import { Link } from 'react-router-dom';

const CycleTable = ({ data }) => {
  const getStatusBadge = (status) => {
    // Ganti 'Selesai' menjadi 'Finish' agar sesuai dengan data dari server
    switch (status) {
      case 'Finish': 
        return <span className="text-green-600 font-semibold">FINISH</span>;
      case 'Proses Screw':
      case 'Proses Function':
        return <span className="text-orange-500 font-semibold">PROCESS</span>;
      default:
        // Ganti default agar sesuai dengan 'Antri Label' dll.
        return <span className="text-gray-500 font-semibold">WAITING</span>;
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm mt-4">
      <div className="flex justify-between items-center mb-4 -mt-2">
        <h3 className="text-lg font-semibold text-gray-700">Cycle Monitor</h3>
        <div className='flex items-center space-x-4'>
            <p className="text-sm text-gray-500">Current Output: #{data.length > 0 ? data[0].output_no || 0 : 0}</p>
            
            <Link
              to="/history"
              className="flex items-center space-x-2 px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <span>See All</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
        </div>
      </div>

      <div className="h-[260px] overflow-auto border border-gray-200 rounded-md">
        <table className="w-full text-base text-left text-gray-600">
          <thead className="text-base text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-6 py-3">Start Time</th>
              <th scope="col" className="px-6 py-3">End Time</th>
              <th scope="col" className="px-6 py-3">Screw (s)</th>
              <th scope="col" className="px-6 py-3">Function (s)</th>
              <th scope="col" className="px-6 py-3">Label (s)</th>
              <th scope="col" className="px-6 py-3">Cycle Time</th>
              <th scope="col" className="px-6 py-3">Output No</th>
              <th scope="col" className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {data.length > 0 ? (
                data.map((item) => (
                <tr key={item.id || item.start_time} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="px-6 py-2">{item.start_time}</td>
                    <td className="px-6 py-2">{item.end_time || '...'}</td>
                    <td className="px-6 py-2">{item.screw > 0 ? `${parseFloat(item.screw).toFixed(2)}` : '...'}</td>
                    <td className="px-6 py-2">{item.function > 0 ? `${parseFloat(item.function).toFixed(2)}` : '...'}</td>
                    {/* --- PERUBAHAN DI SINI --- */}
                    <td className="px-6 py-2">{item.label > 0 ? `${parseFloat(item.label).toFixed(2)}` : '...'}</td>
                    <td className="px-6 py-2">{item.cycle_time > 0 ? `${parseFloat(item.cycle_time).toFixed(2)}` : '...'}</td>
                    <td className="px-6 py-2">{item.output_no || '...'}</td>
                    <td className="px-6 py-2">{getStatusBadge(item.status)}</td>
                </tr>
                ))
            ) : (
                <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    Waiting for a new cycle to start...
                </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CycleTable;
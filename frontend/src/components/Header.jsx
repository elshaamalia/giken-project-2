import React, { useState } from 'react';
import gikenLogo from '../assets/logo-giken.png';

const Header = ({ isConnected }) => {
  // State untuk menyimpan pilihan dropdown saat ini
  const [selectedModel, setSelectedModel] = useState('LINE 7 / AERS');

  const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  // Fungsi untuk menangani perubahan pada dropdown
  const handleModelChange = (event) => {
    setSelectedModel(event.target.value);
    console.log("Model diganti menjadi:", event.target.value);
  };

  return (
    <header className="flex justify-between items-center p-4 bg-white shadow-sm">
      <div>
        <img src={gikenLogo} alt="GIKEN Logo" className="h-16 ml-6" /> 
      </div>
      <div className="flex items-center space-x-4 text-base text-gray-600 mr-4">
        <div className="flex items-center space-x-2">
          <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span>{isConnected ? 'Live' : 'Disconnected'}</span>
        </div>
        
        {/* Dropdown untuk Line/Model */}
        <div>
          <label htmlFor="model-select" className="sr-only">Line / Model</label>
          <select 
            id="model-select"
            value={selectedModel}
            onChange={handleModelChange}
            className="bg-gray-50 border border-gray-300 text-gray-900 font-semibold text-base rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
          >
            <option value="LINE 7 / AERS">LINE 7 / AE85</option>
            <option value="LINE 8 / BCRS">LINE 8 / BCRS (Contoh)</option>
            <option value="LINE 9 / CDFS">LINE 9 / CDFS (Contoh)</option>
          </select>
        </div>

        <span>{`${currentDate}, ${currentTime}`}</span>
      </div>
    </header>
  );
};

export default Header;
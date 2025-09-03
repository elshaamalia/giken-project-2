import React from 'react';

// Icon untuk Screw (Obeng/Perkakas)
const ScrewIcon = ({ color = 'text-gray-500' }) => (
  <svg className={`w-6 h-6 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 00-1 1v1a2 2 0 11-4 0v-1a1 1 0 00-1-1H7a1 1 0 01-1-1v-3a1 1 0 011-1h3a1 1 0 001-1V9a1 1 0 00-1-1H7a1 1 0 01-1-1V4a1 1 0 011-1h3a1 1 0 001-1z"></path>
  </svg>
);

// Icon untuk Function (Roda Gigi/Pengaturan)
const FunctionIcon = ({ color = 'text-gray-500' }) => (
  <svg className={`w-6 h-6 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
  </svg>
);

// Icon untuk Label (Tag/Label)
const LabelIcon = ({ color = 'text-gray-500' }) => (
  <svg className={`w-6 h-6 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
  </svg>
);

// Icon untuk Final Output (Kotak/Produk)
const OutputIcon = ({ color = 'text-gray-500' }) => (
  <svg className={`w-6 h-6 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
  </svg>
);


const StatusCard = ({ title, value, status }) => {
  // Fungsi untuk memilih ikon berdasarkan judul kartu
  const getCardIcon = () => {
    switch (title) {
      case 'SCREW':
        return <ScrewIcon color="text-red-500" />;
      case 'FUNCTION':
        return <FunctionIcon color="text-blue-500" />;
      case 'LABEL':
        return <LabelIcon color="text-green-500" />;
      case 'FINAL OUTPUT':
        return <OutputIcon color="text-orange-500" />;
      default:
        // Jika tidak ada ikon spesifik, gunakan ikon status default atau InfoIcon
        switch (status) {
          case 'ok': return <CheckIcon />;
          case 'warning': return <WarningIcon />;
          case 'in-progress': return <WarningIcon color="text-orange-500" />;
          case 'info': return <InfoIcon />;
          default: return <InfoIcon color="text-gray-500" />; // Fallback icon
        }
    }
  };

  // Fungsi untuk memilih warna teks nilai
  const getValueColor = () => {
    switch (title) {
      case 'SCREW':
        return 'text-red-500';
      case 'FUNCTION':
        return 'text-blue-500';
      case 'LABEL':
        return 'text-green-500';
      case 'FINAL OUTPUT':
        return 'text-orange-500';
      default:
        return 'text-gray-800';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm flex justify-between items-center h-[98px] -mt-2">
      <div>
        {/* --- PERUBAHAN DI SINI --- */}
        <p className="text-base font-semibold text-gray-500 uppercase">{title}</p>
        <p className={`text-3xl font-bold ${getValueColor()}`}>{value}</p>
      </div>
      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100">
        {getCardIcon()}
      </div>
    </div>
  );
};

export default StatusCard;
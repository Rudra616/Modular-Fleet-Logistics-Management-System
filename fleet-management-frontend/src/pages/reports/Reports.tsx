import React from 'react';

const Reports: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Fuel Efficiency</h2>
          <p className="text-gray-500">Report will appear here</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Vehicle ROI</h2>
          <p className="text-gray-500">Report will appear here</p>
        </div>
      </div>
    </div>
  );
};

export default Reports;
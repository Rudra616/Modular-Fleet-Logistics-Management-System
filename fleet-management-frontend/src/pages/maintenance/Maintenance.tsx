import React from 'react';

const Maintenance: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Maintenance Records</h1>
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <button className="bg-blue-500 text-white px-4 py-2 rounded">
            Schedule Maintenance
          </button>
        </div>
        <div className="p-4">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="pb-2">Vehicle</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Date</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500">
                  No maintenance records found
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
import React from 'react';
import { useParams } from 'react-router-dom';

const DriverDetail: React.FC = () => {
  const { id } = useParams();
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Driver Details - #{id}</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p>Driver details will appear here</p>
      </div>
    </div>
  );
};

export default DriverDetail;
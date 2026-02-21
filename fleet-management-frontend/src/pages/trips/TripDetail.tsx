import React from 'react';
import { useParams } from 'react-router-dom';

const TripDetail: React.FC = () => {
  const { id } = useParams();
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Trip Details - #{id}</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p>Trip details will appear here</p>
      </div>
    </div>
  );
};

export default TripDetail;
import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Unauthorized Access</h1>
        <p className="text-gray-600 mb-4">You don't have permission to view this page.</p>
        <Link to="/dashboard" className="text-blue-500 hover:text-blue-600">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
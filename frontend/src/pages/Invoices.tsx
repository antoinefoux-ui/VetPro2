import React from 'react';

function Invoices() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Invoices</h1>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">📄</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invoice Management</h2>
          <p className="text-gray-600 mb-6">
            Invoice approval and management system
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This component requires backend API connection for full functionality.
              Connect to the backend to see invoice approval workflow.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Invoices;

import React from 'react';
import InvoiceApproval from '../components/invoice/invoiceapproval';

function Invoices() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Invoices</h1>
      <InvoiceApproval />
    </div>
  );
}

export default Invoices;

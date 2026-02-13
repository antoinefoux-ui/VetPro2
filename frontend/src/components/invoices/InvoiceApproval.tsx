import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Edit2, Trash2, Plus, Printer, Send, AlertTriangle } from 'lucide-react';
import { t } from '../../locales/translations';

interface InvoiceItem {
  id?: string;
  itemType: 'service' | 'product' | 'medication' | 'diagnostic';
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountPercentage: number;
  inventoryItemId?: string;
  subtotal: number;
  total: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  client: {
    firstName: string;
    lastName: string;
    email: string;
  };
  pet: {
    name: string;
    species: string;
  };
  items: InvoiceItem[];
  aiGenerated: boolean;
}

export const InvoiceApproval: React.FC<{ invoiceId: string; language?: string }> = ({ 
  invoiceId, 
  language = 'en' 
}) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [approving, setApproving] = useState(false);
  const [notes, setNotes] = useState('');

  const fetchInvoice = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`);
      const data = await response.json();
      setInvoice(data);
      setItems(data.items);
    } catch (error) {
      console.error('Error fetching invoice:', error);
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handleApprove = async () => {
    if (!window.confirm(t('invoice.confirmApproval', language))) {
      return;
    }

    setApproving(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: editing ? items : undefined,
          notes,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`${t('invoice.approved', language)}\n\n` +
              `${t('inventory.deducted', language)}: ${result.inventoryDeducted}\n` +
              `${t('labels.generated', language)}: ${result.labelsGenerated}`);
        
        // Refresh invoice
        await fetchInvoice();
      } else {
        const error = await response.json();
        alert(t('common.error', language) + ': ' + error.error);
      }
    } catch (error) {
      console.error('Error approving invoice:', error);
      alert(t('common.error', language));
    } finally {
      setApproving(false);
    }
  };

  const addItem = () => {
    setItems([...items, {
      itemType: 'service',
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 20,
      discountPercentage: 0,
      subtotal: 0,
      total: 0,
    }]);
    setEditing(true);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number | undefined) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate totals
    const item = newItems[index];
    const subtotal = item.quantity * item.unitPrice;
    const discount = subtotal * (item.discountPercentage / 100);
    const afterDiscount = subtotal - discount;
    const tax = afterDiscount * (item.taxRate / 100);
    
    newItems[index].subtotal = subtotal;
    newItems[index].total = afterDiscount + tax;
    
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    setEditing(true);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const taxAmount = items.reduce((sum, item) => sum + (item.total - item.subtotal), 0);
    const total = subtotal + taxAmount;
    
    return { subtotal, taxAmount, total };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <p className="text-lg text-gray-600">{t('invoice.notFound', language)}</p>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">
                {t('invoice.title', language)} {invoice.invoiceNumber}
              </h1>
              <div className="flex items-center gap-4">
                <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                  invoice.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                  invoice.status === 'approved' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {invoice.status.toUpperCase()}
                </span>
                {invoice.aiGenerated && (
                  <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-bold flex items-center gap-2">
                    🤖 {t('invoice.aiGenerated', language)}
                  </span>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-slate-500 mb-1">{t('clients.title', language)}</div>
              <div className="text-lg font-bold text-slate-800">
                {invoice.client.firstName} {invoice.client.lastName}
              </div>
              <div className="text-sm text-slate-600">{invoice.client.email}</div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🐾</span>
              <span className="font-bold text-blue-900">
                {invoice.pet.name} ({invoice.pet.species})
              </span>
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800">
              {t('invoice.items', language)}
            </h2>
            {invoice.status === 'draft' && (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(!editing)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  {editing ? t('common.doneEditing', language) : t('common.edit', language)}
                </button>
                <button
                  onClick={addItem}
                  className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t('invoice.addItem', language)}
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left py-3 px-4 text-slate-600 font-semibold">
                    {t('invoice.type', language)}
                  </th>
                  <th className="text-left py-3 px-4 text-slate-600 font-semibold">
                    {t('invoice.description', language)}
                  </th>
                  <th className="text-center py-3 px-4 text-slate-600 font-semibold">
                    {t('invoice.quantity', language)}
                  </th>
                  <th className="text-right py-3 px-4 text-slate-600 font-semibold">
                    {t('invoice.unitPrice', language)}
                  </th>
                  <th className="text-right py-3 px-4 text-slate-600 font-semibold">
                    {t('invoice.subtotal', language)}
                  </th>
                  <th className="text-right py-3 px-4 text-slate-600 font-semibold">
                    {t('invoice.total', language)}
                  </th>
                  {editing && (
                    <th className="text-center py-3 px-4 text-slate-600 font-semibold">
                      {t('common.actions', language)}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      {editing ? (
                        <select
                          value={item.itemType}
                          onChange={(e) => updateItem(index, 'itemType', e.target.value)}
                          className="px-2 py-1 border border-slate-300 rounded"
                        >
                          <option value="service">{t('invoice.service', language)}</option>
                          <option value="product">{t('invoice.product', language)}</option>
                          <option value="medication">{t('invoice.medication', language)}</option>
                          <option value="diagnostic">{t('invoice.diagnostic', language)}</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          item.itemType === 'medication' ? 'bg-purple-100 text-purple-700' :
                          item.itemType === 'service' ? 'bg-blue-100 text-blue-700' :
                          item.itemType === 'product' ? 'bg-green-100 text-green-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {item.itemType}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {editing ? (
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded"
                        />
                      ) : (
                        <span className="text-slate-800">{item.description}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {editing ? (
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                          className="w-20 px-2 py-1 border border-slate-300 rounded text-center"
                          min="0"
                          step="0.01"
                        />
                      ) : (
                        <span className="font-semibold text-slate-800">{item.quantity}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {editing ? (
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value))}
                          className="w-24 px-2 py-1 border border-slate-300 rounded text-right"
                          min="0"
                          step="0.01"
                        />
                      ) : (
                        <span className="text-slate-800">€{item.unitPrice.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-800">
                      €{item.subtotal.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      €{item.total.toFixed(2)}
                    </td>
                    {editing && (
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-8 border-t-2 border-slate-200 pt-6">
            <div className="flex justify-end">
              <div className="w-96">
                <div className="flex justify-between py-2">
                  <span className="text-slate-600">{t('invoice.subtotal', language)}:</span>
                  <span className="font-semibold text-slate-800">€{totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-600">{t('invoice.tax', language)} (20%):</span>
                  <span className="font-semibold text-slate-800">€{totals.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-slate-300 mt-2">
                  <span className="text-xl font-bold text-slate-800">{t('invoice.total', language)}:</span>
                  <span className="text-2xl font-bold text-blue-600">€{totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.status === 'draft' && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 mb-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              {t('invoice.notes', language)}
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('invoice.addNotes', language)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
          </div>
        )}

        {/* Actions */}
        {invoice.status === 'draft' && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <h3 className="text-2xl font-bold mb-2">
                  {t('invoice.readyToApprove', language)}
                </h3>
                <p className="text-green-100">
                  {t('invoice.approvalWarning', language)}
                </p>
                <ul className="mt-4 space-y-2 text-green-50">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    {t('invoice.inventoryWillDeduct', language)}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    {t('invoice.labelsWillPrint', language)}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    {t('invoice.statusWillUpdate', language)}
                  </li>
                </ul>
              </div>

              <button
                onClick={handleApprove}
                disabled={approving}
                className="px-8 py-4 bg-white text-green-600 rounded-xl font-bold text-lg hover:bg-green-50 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
              >
                {approving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                    {t('common.loading', language)}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-6 h-6" />
                    {t('invoice.approve', language)}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Approved Actions */}
        {invoice.status === 'approved' && (
          <div className="flex gap-4">
            <button className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
              <Printer className="w-5 h-5" />
              {t('invoice.print', language)}
            </button>
            <button className="flex-1 px-6 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
              <Send className="w-5 h-5" />
              {t('invoice.sendToClient', language)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceApproval;

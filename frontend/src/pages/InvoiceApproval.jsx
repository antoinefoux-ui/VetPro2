import React, { useState } from 'react';
import { CheckCircle, Edit2, Trash2, Plus, Printer, Send, AlertTriangle } from 'lucide-react';

const InvoiceApprovalDemo = () => {
  const [language, setLanguage] = useState('en');
  const [editing, setEditing] = useState(false);
  const [approving, setApproving] = useState(false);
  const [items, setItems] = useState([
    { id: 1, type: 'service', description: 'Office Visit - Consultation', quantity: 1, price: 40.00 },
    { id: 2, type: 'medication', description: 'Otomax Ear Drops (15ml)', quantity: 1, price: 25.00 },
    { id: 3, type: 'medication', description: 'Convenia Injection (80mg)', quantity: 1, price: 45.00 },
    { id: 4, type: 'diagnostic', description: 'Ear Swab Culture', quantity: 1, price: 30.00 },
  ]);

  const t = {
    en: { 
      title: 'Invoice Approval', approve: 'Approve Invoice', edit: 'Edit', addItem: 'Add Item',
      type: 'Type', description: 'Description', quantity: 'Qty', price: 'Price', total: 'Total',
      subtotal: 'Subtotal', tax: 'VAT (20%)', grandTotal: 'Grand Total', aiGenerated: 'AI Generated',
      warning: 'Approving will:', action1: 'Deduct inventory automatically', action2: 'Print medication labels',
      action3: 'Finalize invoice', client: 'Client', patient: 'Patient'
    },
    fr: { 
      title: 'Approbation Facture', approve: 'Approuver', edit: 'Modifier', addItem: 'Ajouter',
      type: 'Type', description: 'Description', quantity: 'Qté', price: 'Prix', total: 'Total',
      subtotal: 'Sous-total', tax: 'TVA (20%)', grandTotal: 'Total', aiGenerated: 'IA Généré',
      warning: 'L\'approbation:', action1: 'Déduira l\'inventaire', action2: 'Imprimera les étiquettes',
      action3: 'Finalisera la facture', client: 'Client', patient: 'Patient'
    },
    sk: { 
      title: 'Schválenie Faktúry', approve: 'Schváliť', edit: 'Upraviť', addItem: 'Pridať',
      type: 'Typ', description: 'Popis', quantity: 'Mn.', price: 'Cena', total: 'Celkom',
      subtotal: 'Medzisúčet', tax: 'DPH (20%)', grandTotal: 'Celkom', aiGenerated: 'AI Generované',
      warning: 'Schválenie:', action1: 'Odpočíta inventár', action2: 'Vytlačí štítky',
      action3: 'Dokončí faktúru', client: 'Klient', patient: 'Pacient'
    },
  };

  const lang = t[language];

  const updateItem = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id) => setItems(items.filter(item => item.id !== id));
  
  const addItem = () => {
    setItems([...items, { 
      id: Date.now(), type: 'service', description: '', quantity: 1, price: 0 
    }]);
    setEditing(true);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const tax = subtotal * 0.20;
  const total = subtotal + tax;

  const handleApprove = () => {
    setApproving(true);
    setTimeout(() => {
      alert(`✅ Invoice Approved!\n\n✓ 3 items deducted from inventory\n✓ 2 medication labels printed\n✓ Invoice finalized: INV-2026-000123`);
      setApproving(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-5xl mx-auto">
        
        {/* Language Selector */}
        <div className="flex justify-end gap-2 mb-4">
          {['en', 'fr', 'sk'].map(l => (
            <button
              key={l}
              onClick={() => setLanguage(l)}
              className={`px-4 py-2 rounded-xl font-bold ${
                language === l ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">{lang.title}</h1>
              <div className="flex gap-4">
                <span className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full text-sm font-bold">
                  DRAFT
                </span>
                <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-bold">
                  🤖 {lang.aiGenerated}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-500">{lang.client}</div>
              <div className="text-lg font-bold">Sarah Johnson</div>
              <div className="text-sm text-slate-600">sarah.j@email.com</div>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <span className="text-2xl mr-2">🐾</span>
            <span className="font-bold text-blue-900">{lang.patient}: Max (Dog)</span>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Invoice Items</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(!editing)}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                {lang.edit}
              </button>
              <button
                onClick={addItem}
                className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {lang.addItem}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold">{lang.type}</th>
                  <th className="text-left py-3 px-4 font-semibold">{lang.description}</th>
                  <th className="text-center py-3 px-4 font-semibold">{lang.quantity}</th>
                  <th className="text-right py-3 px-4 font-semibold">{lang.price}</th>
                  <th className="text-right py-3 px-4 font-semibold">{lang.total}</th>
                  {editing && <th className="text-center py-3 px-4 font-semibold">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-b hover:bg-slate-50">
                    <td className="py-3 px-4">
                      {editing ? (
                        <select
                          value={item.type}
                          onChange={(e) => updateItem(item.id, 'type', e.target.value)}
                          className="px-2 py-1 border rounded"
                        >
                          <option value="service">Service</option>
                          <option value="medication">Medication</option>
                          <option value="product">Product</option>
                          <option value="diagnostic">Diagnostic</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          item.type === 'medication' ? 'bg-purple-100 text-purple-700' :
                          item.type === 'service' ? 'bg-blue-100 text-blue-700' :
                          item.type === 'diagnostic' ? 'bg-orange-100 text-orange-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {item.type}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {editing ? (
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          className="w-full px-2 py-1 border rounded"
                        />
                      ) : item.description}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {editing ? (
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value))}
                          className="w-20 px-2 py-1 border rounded text-center"
                        />
                      ) : item.quantity}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {editing ? (
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value))}
                          className="w-24 px-2 py-1 border rounded text-right"
                        />
                      ) : `€${item.price.toFixed(2)}`}
                    </td>
                    <td className="py-3 px-4 text-right font-bold">
                      €{(item.quantity * item.price).toFixed(2)}
                    </td>
                    {editing && (
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-800"
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
          <div className="mt-8 border-t-2 pt-6">
            <div className="flex justify-end">
              <div className="w-96">
                <div className="flex justify-between py-2">
                  <span className="text-slate-600">{lang.subtotal}:</span>
                  <span className="font-semibold">€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-600">{lang.tax}:</span>
                  <span className="font-semibold">€{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-3 border-t-2 mt-2">
                  <span className="text-xl font-bold">{lang.grandTotal}:</span>
                  <span className="text-2xl font-bold text-blue-600">€{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Approval Section */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h3 className="text-2xl font-bold mb-2">Ready to Approve?</h3>
              <p className="text-green-100 mb-4">{lang.warning}</p>
              <ul className="space-y-2 text-green-50">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  {lang.action1}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  {lang.action2}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  {lang.action3}
                </li>
              </ul>
            </div>

            <button
              onClick={handleApprove}
              disabled={approving}
              className="px-8 py-4 bg-white text-green-600 rounded-xl font-bold text-lg hover:bg-green-50 shadow-lg disabled:opacity-50 flex items-center gap-3"
            >
              {approving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-6 h-6" />
                  {lang.approve}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceApprovalDemo;

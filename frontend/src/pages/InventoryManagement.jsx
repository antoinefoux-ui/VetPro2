import React, { useState } from 'react';
import { Package, AlertTriangle, TrendingDown, Plus, ShoppingCart, Search, Filter } from 'lucide-react';

const InventoryManagement = () => {
  const [language, setLanguage] = useState('en');
  const [filter, setFilter] = useState('all');

  const t = {
    en: { 
      title: 'Inventory Management', search: 'Search items...', alerts: 'Alerts', 
      critical: 'Critical', low: 'Low Stock', normal: 'Normal', orderNow: 'Order Now',
      stock: 'Stock', minimum: 'Min', value: 'Value', categories: 'Categories',
      all: 'All Items', lowStock: 'Low Stock', outOfStock: 'Out of Stock',
      name: 'Item Name', current: 'Current', status: 'Status', action: 'Action'
    },
    fr: { 
      title: 'Gestion Inventaire', search: 'Rechercher...', alerts: 'Alertes',
      critical: 'Critique', low: 'Bas Stock', normal: 'Normal', orderNow: 'Commander',
      stock: 'Stock', minimum: 'Min', value: 'Valeur', categories: 'Catégories',
      all: 'Tous', lowStock: 'Stock Bas', outOfStock: 'Épuisé',
      name: 'Article', current: 'Actuel', status: 'Statut', action: 'Action'
    },
    sk: { 
      title: 'Správa Inventára', search: 'Hľadať...', alerts: 'Upozornenia',
      critical: 'Kritické', low: 'Nízke zásoby', normal: 'Normálne', orderNow: 'Objednať',
      stock: 'Zásoby', minimum: 'Min', value: 'Hodnota', categories: 'Kategórie',
      all: 'Všetko', lowStock: 'Nízke zásoby', outOfStock: 'Vypredané',
      name: 'Názov položky', current: 'Aktuálny', status: 'Stav', action: 'Akcia'
    },
  };

  const lang = t[language];

  const inventory = [
    { id: 1, name: 'Rabies Vaccine', category: 'Vaccines', stock: 0, min: 10, cost: 15, price: 35, status: 'critical' },
    { id: 2, name: 'Amoxicillin 500mg', category: 'Medication', stock: 2, min: 10, cost: 8, price: 20, status: 'low' },
    { id: 3, name: 'Surgical Gloves (M)', category: 'Supplies', stock: 1, min: 3, cost: 5, price: 12, status: 'low' },
    { id: 4, name: 'Heartworm Prevention', category: 'Medication', stock: 5, min: 12, cost: 12, price: 30, status: 'low' },
    { id: 5, name: 'Dog Food Premium (15kg)', category: 'Food', stock: 25, min: 5, cost: 30, price: 55, status: 'normal' },
    { id: 6, name: 'Flea Treatment', category: 'Medication', stock: 15, min: 8, cost: 20, price: 45, status: 'normal' },
    { id: 7, name: 'Syringes (Pack of 100)', category: 'Supplies', stock: 0, min: 2, cost: 15, price: 35, status: 'critical' },
    { id: 8, name: 'Cat Litter (10kg)', category: 'Products', stock: 18, min: 5, cost: 8, price: 18, status: 'normal' },
  ];

  const getStatusColor = (status) => ({
    critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-500' },
    low: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-500' },
    normal: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-500' },
  }[status]);

  const filteredInventory = filter === 'all' 
    ? inventory 
    : filter === 'low' 
      ? inventory.filter(i => i.status === 'low' || i.status === 'critical')
      : inventory.filter(i => i.status === 'critical');

  const criticalCount = inventory.filter(i => i.status === 'critical').length;
  const lowCount = inventory.filter(i => i.status === 'low').length;
  const totalValue = inventory.reduce((sum, item) => sum + (item.stock * item.price), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl flex items-center justify-center">
                <Package className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">{lang.title}</h1>
                <p className="text-slate-500">{inventory.length} total items</p>
              </div>
            </div>

            <div className="flex gap-2">
              {['en', 'fr', 'sk'].map(l => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  className={`px-4 py-2 rounded-xl font-bold ${
                    language === l ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-8 h-8" />
              <div className="text-4xl font-bold">{criticalCount}</div>
            </div>
            <div className="text-red-100">{lang.critical}</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="w-8 h-8" />
              <div className="text-4xl font-bold">{lowCount}</div>
            </div>
            <div className="text-orange-100">{lang.low}</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8" />
              <div className="text-4xl font-bold">{inventory.length - criticalCount - lowCount}</div>
            </div>
            <div className="text-green-100">{lang.normal}</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">€</span>
              <div className="text-4xl font-bold">{(totalValue / 1000).toFixed(1)}k</div>
            </div>
            <div className="text-blue-100">{lang.value}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder={lang.search}
                className="w-full pl-10 pr-4 py-3 bg-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-3 rounded-xl font-semibold ${
                  filter === 'all' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {lang.all}
              </button>
              <button
                onClick={() => setFilter('low')}
                className={`px-4 py-3 rounded-xl font-semibold ${
                  filter === 'low' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {lang.lowStock}
              </button>
              <button
                onClick={() => setFilter('critical')}
                className={`px-4 py-3 rounded-xl font-semibold ${
                  filter === 'critical' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {lang.critical}
              </button>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-200">
                  <th className="text-left py-4 px-6 font-bold text-slate-700">{lang.name}</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700">Category</th>
                  <th className="text-center py-4 px-6 font-bold text-slate-700">{lang.current}</th>
                  <th className="text-center py-4 px-6 font-bold text-slate-700">{lang.minimum}</th>
                  <th className="text-center py-4 px-6 font-bold text-slate-700">{lang.status}</th>
                  <th className="text-right py-4 px-6 font-bold text-slate-700">{lang.value}</th>
                  <th className="text-center py-4 px-6 font-bold text-slate-700">{lang.action}</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map(item => {
                  const colors = getStatusColor(item.status);
                  return (
                    <tr key={item.id} className={`border-b border-slate-100 hover:${colors.bg} transition-colors`}>
                      <td className="py-4 px-6 font-semibold text-slate-800">{item.name}</td>
                      <td className="py-4 px-6 text-slate-600">{item.category}</td>
                      <td className="py-4 px-6 text-center">
                        <span className="font-bold text-lg">{item.stock}</span>
                      </td>
                      <td className="py-4 px-6 text-center text-slate-500">{item.min}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <div className={`w-full max-w-xs h-2 bg-slate-200 rounded-full overflow-hidden`}>
                            <div 
                              className={`h-full ${colors.badge} transition-all`}
                              style={{ width: `${Math.min((item.stock / item.min) * 100, 100)}%` }}
                            />
                          </div>
                          <span className={`px-3 py-1 ${colors.bg} ${colors.text} rounded-full text-xs font-bold uppercase ${colors.border} border`}>
                            {item.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-semibold">
                        €{(item.stock * item.price).toFixed(2)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          {item.status !== 'normal' && (
                            <button className="px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 flex items-center gap-2">
                              <ShoppingCart className="w-4 h-4" />
                              {lang.orderNow}
                            </button>
                          )}
                          <button className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Critical Alerts Banner */}
        {criticalCount > 0 && (
          <div className="mt-6 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <AlertTriangle className="w-8 h-8 animate-pulse" />
                <div>
                  <div className="text-2xl font-bold">{criticalCount} Items Out of Stock</div>
                  <div className="text-red-100">Immediate action required</div>
                </div>
              </div>
              <button className="px-6 py-3 bg-white text-red-600 rounded-xl font-bold hover:bg-red-50 shadow-lg">
                Generate Purchase Order
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryManagement;

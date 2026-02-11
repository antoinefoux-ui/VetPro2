import React, { useState, useEffect } from 'react';
import { Calendar, Users, DollarSign, Package, Bell, Activity, Clock, AlertTriangle, CheckCircle, TrendingUp, Stethoscope, Syringe, Pill } from 'lucide-react';

const VetProDashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const translations = {
    en: { title: 'Dashboard', appointments: 'Appointments', revenue: 'Revenue', inventory: 'Inventory', surgeries: 'Surgeries', staff: 'Staff', alerts: 'Alerts' },
    fr: { title: 'Tableau de bord', appointments: 'Rendez-vous', revenue: 'Revenu', inventory: 'Inventaire', surgeries: 'Chirurgies', staff: 'Personnel', alerts: 'Alertes' },
    sk: { title: 'Prehľad', appointments: 'Stretnutia', revenue: 'Príjem', inventory: 'Inventár', surgeries: 'Operácie', staff: 'Personál', alerts: 'Upozornenia' },
    es: { title: 'Panel', appointments: 'Citas', revenue: 'Ingresos', inventory: 'Inventario', surgeries: 'Cirugías', staff: 'Personal', alerts: 'Alertas' },
  };

  const t = translations[language];

  const stats = [
    { label: t.appointments, value: '24', change: '+12%', color: 'from-blue-500 to-cyan-500', icon: Calendar },
    { label: t.revenue, value: '€2,450', change: '+18%', color: 'from-emerald-500 to-teal-500', icon: DollarSign },
    { label: t.inventory, value: '4', change: 'Low Stock', color: 'from-orange-500 to-red-500', icon: Package },
  ];

  const appointments = [
    { time: '3:30 PM', pet: 'Max', owner: 'Johnson', type: 'Checkup', vet: 'Dr. Smith' },
    { time: '4:00 PM', pet: 'Mittens', owner: 'Garcia', type: 'Vaccination', vet: 'Dr. Jones' },
    { time: '4:30 PM', pet: 'Rex', owner: 'Martinez', type: 'Follow-up', vet: 'Dr. Smith' },
  ];

  const rooms = [
    { name: 'Room 1', status: 'occupied', vet: 'Dr. Jones', pet: 'Luna', duration: 15 },
    { name: 'Room 2', status: 'surgery', vet: 'Dr. Smith', pet: 'Bella', duration: 45 },
    { name: 'Room 3', status: 'available' },
    { name: 'Room 4', status: 'available' },
  ];

  const inventoryAlerts = [
    { name: 'Rabies Vaccine', stock: 0, min: 10, status: 'critical' },
    { name: 'Amoxicillin 500mg', stock: 2, min: 10, status: 'low' },
    { name: 'Surgical Gloves (M)', stock: 1, min: 3, status: 'low' },
  ];

  const getRoomColor = (status) => ({
    available: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500',
    occupied: 'from-blue-500/20 to-blue-600/20 border-blue-500',
    surgery: 'from-red-500/20 to-red-600/20 border-red-500'
  }[status]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/60 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
              <Stethoscope className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                VetPro {t.title}
              </h1>
              <p className="text-sm text-slate-500 font-medium">{currentTime.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {['en', 'fr', 'sk', 'es'].map(lang => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-4 py-2 rounded-xl font-bold transition-all ${
                  language === lang 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-6 hover:shadow-2xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                {stat.change}
              </span>
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-1">{stat.value}</div>
            <div className="text-sm text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rooms Status */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Exam Rooms
            </h2>
          </div>
          <div className="p-6 space-y-3">
            {rooms.map((room, i) => (
              <div key={i} className={`bg-gradient-to-br ${getRoomColor(room.status)} rounded-xl p-4 border-2`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">{room.name}</div>
                    {room.status !== 'available' && (
                      <div className="text-sm text-slate-600 mt-1">
                        <div>{room.vet} • {room.pet}</div>
                        <div className="text-xs text-slate-500">{room.duration} min elapsed</div>
                      </div>
                    )}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    room.status === 'available' ? 'bg-emerald-500 text-white' :
                    room.status === 'surgery' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
                  }`}>
                    {room.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Appointments */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Next {t.appointments}
            </h2>
          </div>
          <div className="p-6 space-y-3">
            {appointments.map((apt, i) => (
              <div key={i} className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-blue-900">{apt.time}</div>
                  <div className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full font-bold">
                    {apt.type}
                  </div>
                </div>
                <div className="text-slate-700">
                  <span className="font-bold">{apt.pet}</span> - {apt.owner}
                </div>
                <div className="text-sm text-slate-500 mt-1">{apt.vet}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory Alerts */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden lg:col-span-2">
          <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {t.inventory} {t.alerts}
            </h2>
            <div className="px-4 py-2 bg-white/20 rounded-full text-white font-bold text-sm">
              {inventoryAlerts.length} Critical
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {inventoryAlerts.map((item, i) => (
                <div key={i} className={`p-4 rounded-xl border-2 ${
                  item.status === 'critical' ? 'bg-red-50 border-red-200 text-red-700' :
                  'bg-orange-50 border-orange-200 text-orange-700'
                }`}>
                  <div className="font-bold mb-2">{item.name}</div>
                  <div className="text-sm mb-2">Stock: {item.stock} / Min: {item.min}</div>
                  <div className="w-full h-2 bg-white/50 rounded-full overflow-hidden">
                    <div 
                      className={item.status === 'critical' ? 'bg-red-600 h-full' : 'bg-orange-600 h-full'}
                      style={{ width: `${(item.stock / item.min) * 100}%` }}
                    />
                  </div>
                  <button className="mt-3 w-full py-2 bg-white rounded-lg font-bold text-sm hover:shadow-lg transition-all">
                    Order Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VetProDashboard;

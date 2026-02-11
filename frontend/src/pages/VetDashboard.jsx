import React, { useState, useEffect } from 'react';
import { Calendar, Users, DollarSign, Package, Bell, Search, Plus, Activity, Clock, AlertTriangle, CheckCircle, TrendingUp, Phone, Mail, Stethoscope, Syringe, Pill, FileText, BarChart3, Settings } from 'lucide-react';

// Mock data
const mockAppointments = [
  { id: 1, time: '3:30 PM', pet: 'Max', owner: 'Johnson', type: 'checkup', vet: 'Dr. Smith', status: 'upcoming' },
  { id: 2, time: '4:00 PM', pet: 'Mittens', owner: 'Garcia', type: 'vaccination', vet: 'Dr. Jones', status: 'upcoming' },
  { id: 3, time: '4:30 PM', pet: 'Rex', owner: 'Martinez', type: 'follow-up', vet: 'Dr. Smith', status: 'upcoming' },
];

const mockRooms = [
  { id: 1, name: 'Room 1', status: 'occupied', vet: 'Dr. Jones', pet: 'Luna', duration: 15 },
  { id: 2, name: 'Room 2', status: 'surgery', vet: 'Dr. Smith', pet: 'Bella', duration: 45 },
  { id: 3, name: 'Room 3', status: 'available' },
  { id: 4, name: 'Room 4', status: 'available' },
];

const mockStaff = [
  { id: 1, name: 'Dr. Smith', role: 'Vet', status: 'surgery', nextFree: '3:00 PM' },
  { id: 2, name: 'Dr. Jones', role: 'Vet', status: 'patient', nextFree: '2:45 PM' },
  { id: 3, name: 'Sarah', role: 'Nurse', status: 'available' },
  { id: 4, name: 'Mike', role: 'Nurse', status: 'assisting' },
];

const mockInventory = [
  { id: 1, name: 'Rabies Vaccine', stock: 0, min: 10, status: 'critical' },
  { id: 2, name: 'Amoxicillin 500mg', stock: 2, min: 10, status: 'low' },
  { id: 3, name: 'Surgical Gloves (M)', stock: 1, min: 3, status: 'low' },
  { id: 4, name: 'Heartworm Prevention', stock: 5, min: 12, status: 'warning' },
];

const mockTasks = [
  { id: 1, text: 'Call Mrs. Peterson re: Fluffy\'s lab results', priority: 'urgent' },
  { id: 2, text: 'Approve supply order - €850', priority: 'high' },
  { id: 3, text: 'Review 3 new client applications', priority: 'medium' },
  { id: 4, text: 'Sign off on yesterday\'s surgical reports', priority: 'high' },
];

const VetDashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState(7);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getRoomColor = (status) => {
    const colors = {
      available: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30',
      occupied: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
      surgery: 'from-red-500/20 to-red-600/20 border-red-500/30'
    };
    return colors[status] || colors.available;
  };

  const getStaffColor = (status) => {
    const colors = {
      available: 'bg-emerald-500',
      patient: 'bg-blue-500',
      surgery: 'bg-red-500',
      assisting: 'bg-amber-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getInventoryColor = (status) => {
    const colors = {
      critical: 'text-red-600 bg-red-50 border-red-200',
      low: 'text-orange-600 bg-orange-50 border-orange-200',
      warning: 'text-yellow-600 bg-yellow-50 border-yellow-200'
    };
    return colors[status];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Animated background pattern */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 15a15 15 0 0 1 15 15 15 15 0 0 1-15 15 15 15 0 0 1-15-15 15 15 0 0 1 15-15z' fill='%23000' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
        }}/>
      </div>

      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 rotate-3 hover:rotate-0 transition-transform duration-300">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  VetPro Dashboard
                </h1>
                <p className="text-sm text-slate-500 font-medium">
                  {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="text"
                  placeholder="Search patients, clients, appointments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-100/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all duration-300 text-slate-700 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Quick Actions & Time */}
            <div className="flex items-center gap-4">
              <div className="text-right mr-4">
                <div className="text-2xl font-bold text-slate-800 tabular-nums">
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-xs text-slate-500 font-medium">CEST</div>
              </div>
              
              <button className="relative p-3 hover:bg-slate-100 rounded-xl transition-colors group">
                <Bell className="w-6 h-6 text-slate-600 group-hover:text-blue-600 transition-colors" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg animate-pulse">
                    {notifications}
                  </span>
                )}
              </button>
              
              <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 flex items-center gap-2 hover:scale-105">
                <Plus className="w-5 h-5" />
                New Appointment
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      <div className="max-w-[1800px] mx-auto px-8 pt-6">
        <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl p-4 shadow-lg shadow-red-500/20 border border-red-400/30">
          <div className="flex items-center gap-4 text-white">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
            <div className="flex-1 flex items-center gap-8">
              <span className="font-bold">CRITICAL ALERTS:</span>
              <span className="text-red-100">🔴 Rabies Vaccine OUT OF STOCK</span>
              <span className="text-red-100">⚠️ Equipment maintenance overdue</span>
              <span className="text-red-100">📋 3 unpaid invoices &gt;30 days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="max-w-[1800px] mx-auto px-8 py-6">
        <div className="grid grid-cols-12 gap-6">
          
          {/* Left Column - Clinical Operations */}
          <div className="col-span-4 space-y-6">
            
            {/* Current Room Status */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-xl shadow-slate-200/50 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 border-b border-slate-600">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Exam Rooms Status
                </h2>
              </div>
              <div className="p-6 space-y-3">
                {mockRooms.map(room => (
                  <div key={room.id} className={`bg-gradient-to-br ${getRoomColor(room.status)} rounded-xl p-4 border-2 transition-all duration-300 hover:scale-[1.02]`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-800">{room.name}</div>
                        {room.status !== 'available' && (
                          <div className="text-sm text-slate-600 mt-1">
                            <div className="font-medium">{room.vet} • {room.pet}</div>
                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                              <Clock className="w-3 h-3" />
                              {room.duration} min elapsed
                            </div>
                          </div>
                        )}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        room.status === 'available' ? 'bg-emerald-500 text-white' :
                        room.status === 'surgery' ? 'bg-red-500 text-white' :
                        'bg-blue-500 text-white'
                      }`}>
                        {room.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Today's Surgeries */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-xl shadow-slate-200/50 overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-4 border-b border-red-500">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Syringe className="w-5 h-5" />
                  Surgeries Today
                </h2>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <div className="flex-1">
                    <div className="font-bold text-slate-800">9:00 AM - Spay (Dr. Smith)</div>
                    <div className="text-sm text-slate-600">"Bella" - ✅ Completed</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <Activity className="w-5 h-5 text-blue-600 animate-pulse" />
                  <div className="flex-1">
                    <div className="font-bold text-slate-800">2:00 PM - Dental (Dr. Jones)</div>
                    <div className="text-sm text-slate-600">"Charlie" - 🟡 In Progress</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <Clock className="w-5 h-5 text-slate-500" />
                  <div className="flex-1">
                    <div className="font-bold text-slate-800">4:00 PM - Growth Removal</div>
                    <div className="text-sm text-slate-600">"Rocky" - ⏳ Upcoming</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Staff Status */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-xl shadow-slate-200/50 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 border-b border-indigo-500">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Staff Status
                </h2>
              </div>
              <div className="p-6 space-y-3">
                {mockStaff.map(staff => (
                  <div key={staff.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors">
                    <div className={`w-3 h-3 rounded-full ${getStaffColor(staff.status)} shadow-lg`}></div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-800">{staff.name}</div>
                      <div className="text-sm text-slate-600">{staff.role}</div>
                    </div>
                    {staff.nextFree && (
                      <div className="text-xs text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-200">
                        Free: {staff.nextFree}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center Column - Appointments & Tasks */}
          <div className="col-span-4 space-y-6">
            
            {/* Today's Appointments */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-xl shadow-slate-200/50 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4 border-b border-blue-500">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Next Appointments
                </h2>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
                  <div>
                    <div className="text-3xl font-bold text-slate-800">24</div>
                    <div className="text-sm text-slate-500">Total Today</div>
                  </div>
                  <div className="h-12 w-px bg-slate-200"></div>
                  <div>
                    <div className="text-3xl font-bold text-emerald-600">18</div>
                    <div className="text-sm text-slate-500">Completed</div>
                  </div>
                  <div className="h-12 w-px bg-slate-200"></div>
                  <div>
                    <div className="text-3xl font-bold text-blue-600">6</div>
                    <div className="text-sm text-slate-500">Upcoming</div>
                  </div>
                </div>
                
                <div className="space-y-3 mt-4">
                  {mockAppointments.map(apt => (
                    <div key={apt.id} className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 hover:shadow-lg hover:border-blue-300 transition-all duration-300">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-bold text-blue-900">{apt.time}</div>
                        <div className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full font-bold uppercase">
                          {apt.type}
                        </div>
                      </div>
                      <div className="text-slate-700">
                        <span className="font-bold">{apt.pet}</span> {apt.owner}
                      </div>
                      <div className="text-sm text-slate-500 mt-1">{apt.vet}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tasks & Reminders */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-xl shadow-slate-200/50 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4 border-b border-amber-500">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Tasks & Reminders
                </h2>
              </div>
              <div className="p-6 space-y-2">
                {mockTasks.map(task => (
                  <div key={task.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-amber-300 transition-colors group">
                    <input type="checkbox" className="mt-1 w-4 h-4 text-amber-600 rounded border-slate-300" />
                    <div className="flex-1">
                      <div className="text-slate-800 group-hover:text-slate-900">{task.text}</div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                      task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                      task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {task.priority.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Business Metrics */}
          <div className="col-span-4 space-y-6">
            
            {/* Revenue Today */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-xl shadow-slate-200/50 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 border-b border-emerald-500">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Today's Revenue
                </h2>
              </div>
              <div className="p-6">
                <div className="text-5xl font-bold text-slate-800 mb-2">€2,450</div>
                <div className="flex items-center gap-2 text-emerald-600 mb-4">
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-bold">+12% vs last week</span>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Services</span>
                    <span className="font-bold text-slate-800">€1,800</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Products</span>
                    <span className="font-bold text-slate-800">€450</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Medications</span>
                    <span className="font-bold text-slate-800">€200</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">Target Progress</span>
                    <span className="text-sm font-bold text-slate-800">82%</span>
                  </div>
                  <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full w-[82%] bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000"></div>
                  </div>
                  <div className="text-xs text-slate-500 mt-2">Target: €3,000</div>
                </div>
              </div>
            </div>

            {/* Inventory Alerts */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-xl shadow-slate-200/50 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4 border-b border-orange-500">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Inventory Alerts
                </h2>
              </div>
              <div className="p-6 space-y-3">
                {mockInventory.map(item => (
                  <div key={item.id} className={`p-3 rounded-xl border-2 ${getInventoryColor(item.status)}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-bold">{item.name}</div>
                      <div className="text-xs font-bold uppercase">{item.status}</div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex-1 h-2 bg-white/50 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            item.status === 'critical' ? 'bg-red-600' :
                            item.status === 'low' ? 'bg-orange-600' :
                            'bg-yellow-600'
                          }`}
                          style={{ width: `${(item.stock / item.min) * 100}%` }}
                        ></div>
                      </div>
                      <span className="font-bold">{item.stock}/{item.min}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* This Week Summary */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-xl shadow-slate-200/50 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 border-b border-purple-500">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  This Week
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                    <div className="text-2xl font-bold text-blue-900">87</div>
                    <div className="text-sm text-blue-700">Appointments</div>
                    <div className="text-xs text-blue-600 mt-1">Target: 90</div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl border border-emerald-200">
                    <div className="text-2xl font-bold text-emerald-900">€12.3k</div>
                    <div className="text-sm text-emerald-700">Revenue</div>
                    <div className="text-xs text-emerald-600 mt-1">Target: €13k</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                    <div className="text-2xl font-bold text-purple-900">8</div>
                    <div className="text-sm text-purple-700">New Clients</div>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
                    <div className="text-2xl font-bold text-amber-900">4.8</div>
                    <div className="text-sm text-amber-700">Satisfaction</div>
                    <div className="text-xs text-amber-600 mt-1">47 surveys</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Bar */}
        <div className="mt-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-xl shadow-slate-200/50 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">Quick Actions</h3>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 font-semibold shadow-lg shadow-blue-500/30">
                <Calendar className="w-4 h-4" />
                View Calendar
              </button>
              <button className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 font-semibold shadow-lg shadow-emerald-500/30">
                <DollarSign className="w-4 h-4" />
                Process Payment
              </button>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center gap-2 font-semibold shadow-lg shadow-purple-500/30">
                <Package className="w-4 h-4" />
                Check Inventory
              </button>
              <button className="px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors flex items-center gap-2 font-semibold shadow-lg shadow-amber-500/30">
                <Mail className="w-4 h-4" />
                Send Message
              </button>
              <button className="px-4 py-2 bg-slate-600 text-white rounded-xl hover:bg-slate-700 transition-colors flex items-center gap-2 font-semibold shadow-lg shadow-slate-500/30">
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VetDashboard;

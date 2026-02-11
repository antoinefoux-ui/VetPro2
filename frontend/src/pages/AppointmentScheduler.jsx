import React, { useState } from 'react';
import { Calendar, Clock, User, Stethoscope, Plus, Check, X, Search } from 'lucide-react';

const AppointmentScheduler = () => {
  const [language, setLanguage] = useState('en');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedVet, setSelectedVet] = useState('all');
  const [showNewAppt, setShowNewAppt] = useState(false);

  const t = {
    en: { title: 'Appointment Scheduler', newAppt: 'New Appointment', search: 'Search patient...', 
          vet: 'Veterinarian', patient: 'Patient', time: 'Time', type: 'Type', status: 'Status',
          allVets: 'All Vets', available: 'Available', booked: 'Booked', completed: 'Completed' },
    fr: { title: 'Planificateur', newAppt: 'Nouveau RDV', search: 'Chercher patient...',
          vet: 'Vétérinaire', patient: 'Patient', time: 'Heure', type: 'Type', status: 'Statut',
          allVets: 'Tous', available: 'Disponible', booked: 'Réservé', completed: 'Terminé' },
    sk: { title: 'Plánovač', newAppt: 'Nové stretnutie', search: 'Hľadať pacienta...',
          vet: 'Veterinár', patient: 'Pacient', time: 'Čas', type: 'Typ', status: 'Stav',
          allVets: 'Všetci', available: 'Voľný', booked: 'Obsadený', completed: 'Dokončené' },
  };

  const lang = t[language];

  const vets = [
    { id: 'smith', name: 'Dr. Smith', specialty: 'Surgery', color: 'blue' },
    { id: 'jones', name: 'Dr. Jones', specialty: 'General', color: 'green' },
    { id: 'garcia', name: 'Dr. Garcia', specialty: 'Exotic', color: 'purple' },
  ];

  const timeSlots = Array.from({ length: 20 }, (_, i) => {
    const hour = Math.floor(i / 2) + 9;
    const min = (i % 2) * 30;
    return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
  });

  const appointments = {
    smith: [
      { time: '09:00', patient: 'Max (Johnson)', type: 'Checkup', status: 'completed' },
      { time: '10:30', patient: 'Luna (Martinez)', type: 'Surgery', status: 'booked' },
      { time: '14:00', patient: 'Bella (Garcia)', type: 'Vaccination', status: 'booked' },
    ],
    jones: [
      { time: '09:30', patient: 'Charlie (Brown)', type: 'Follow-up', status: 'completed' },
      { time: '11:00', patient: 'Rocky (Davis)', type: 'Checkup', status: 'booked' },
      { time: '15:30', patient: 'Mittens (Wilson)', type: 'Emergency', status: 'booked' },
    ],
    garcia: [
      { time: '10:00', patient: 'Tweety (Anderson)', type: 'Checkup', status: 'booked' },
      { time: '13:00', patient: 'Spike (Lee)', type: 'Vaccination', status: 'booked' },
    ],
  };

  const getApptForSlot = (vetId, time) => {
    return appointments[vetId]?.find(apt => apt.time === time);
  };

  const getStatusColor = (status) => ({
    completed: 'bg-green-500',
    booked: 'bg-blue-500',
    available: 'bg-gray-200',
  }[status] || 'bg-gray-200');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">{lang.title}</h1>
                <p className="text-slate-500">{selectedDate.toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex gap-2">
              {['en', 'fr', 'sk'].map(l => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  className={`px-4 py-2 rounded-xl font-bold ${
                    language === l ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="mt-6 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder={lang.search}
                className="w-full pl-10 pr-4 py-3 bg-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={selectedVet}
              onChange={(e) => setSelectedVet(e.target.value)}
              className="px-4 py-3 bg-slate-100 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{lang.allVets}</option>
              {vets.map(vet => (
                <option key={vet.id} value={vet.id}>{vet.name}</option>
              ))}
            </select>

            <button
              onClick={() => setShowNewAppt(!showNewAppt)}
              className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {lang.newAppt}
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 mb-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm font-semibold">{lang.completed}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm font-semibold">{lang.booked}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <span className="text-sm font-semibold">{lang.available}</span>
            </div>
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-4 border-b-2 border-slate-300 bg-slate-50">
            <div className="p-4 font-bold text-slate-700">{lang.time}</div>
            {vets.map(vet => (
              <div key={vet.id} className="p-4 border-l border-slate-200">
                <div className="font-bold text-slate-800">{vet.name}</div>
                <div className="text-sm text-slate-500">{vet.specialty}</div>
              </div>
            ))}
          </div>

          <div className="max-h-[600px] overflow-y-auto">
            {timeSlots.map(time => (
              <div key={time} className="grid grid-cols-4 border-b border-slate-100 hover:bg-slate-50">
                <div className="p-4 font-semibold text-slate-600 border-r border-slate-200">
                  <Clock className="w-4 h-4 inline mr-2" />
                  {time}
                </div>
                {vets.map(vet => {
                  const appt = getApptForSlot(vet.id, time);
                  return (
                    <div key={vet.id} className="p-2 border-l border-slate-100">
                      {appt ? (
                        <div className={`${getStatusColor(appt.status)} text-white rounded-lg p-3 cursor-pointer hover:shadow-lg transition-all`}>
                          <div className="font-bold text-sm mb-1">{appt.patient}</div>
                          <div className="text-xs opacity-90">{appt.type}</div>
                        </div>
                      ) : (
                        <button className="w-full h-full bg-gray-50 hover:bg-blue-50 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 transition-all">
                          <Plus className="w-4 h-4 text-gray-400 mx-auto" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mt-6">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl p-6">
            <div className="text-4xl font-bold mb-2">18</div>
            <div className="text-green-100">{lang.completed} Today</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white rounded-2xl p-6">
            <div className="text-4xl font-bold mb-2">6</div>
            <div className="text-blue-100">{lang.booked} Remaining</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-2xl p-6">
            <div className="text-4xl font-bold mb-2">24</div>
            <div className="text-purple-100">Total Appointments</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentScheduler;

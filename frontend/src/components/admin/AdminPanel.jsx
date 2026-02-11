import React, { useState, useEffect } from 'react';
import { 
  Users, Settings, Home, Package, ShoppingBag, Store, 
  Plus, Edit2, Trash2, Save, X, Check, AlertTriangle,
  Clock, MapPin, Mail, Phone, Shield, Key
} from 'lucide-react';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);

  const tabs = [
    { id: 'users', name: 'User Management', icon: Users },
    { id: 'practice', name: 'Practice Settings', icon: Settings },
    { id: 'rooms', name: 'Rooms & Facilities', icon: Home },
    { id: 'equipment', name: 'Equipment', icon: Package },
    { id: 'eshop', name: 'E-Shop Settings', icon: ShoppingBag },
    { id: 'physical-shop', name: 'Physical Shop', icon: Store },
  ];

  const roles = [
    { value: 'admin', label: 'Administrator', color: 'purple' },
    { value: 'veterinarian', label: 'Veterinarian', color: 'blue' },
    { value: 'nurse', label: 'Nurse', color: 'green' },
    { value: 'receptionist', label: 'Receptionist', color: 'yellow' },
    { value: 'shop_staff', label: 'Shop Staff', color: 'orange' },
    { value: 'student', label: 'Student', color: 'gray' },
  ];

  const permissions = ['admin', 'owner', 'edit', 'read'];

  // Mock data
  useEffect(() => {
    setUsers([
      { id: 1, firstName: 'Sarah', lastName: 'Johnson', email: 'sarah@vet.com', role: 'veterinarian', permissions: ['edit', 'read'], isActive: true, specialization: 'Surgery' },
      { id: 2, firstName: 'Mike', lastName: 'Davis', email: 'mike@vet.com', role: 'nurse', permissions: ['edit', 'read'], isActive: true, specialization: null },
      { id: 3, firstName: 'Emma', lastName: 'Wilson', email: 'emma@vet.com', role: 'admin', permissions: ['admin'], isActive: true, specialization: null },
    ]);

    setRooms([
      { id: 1, name: 'Exam Room 1', type: 'examination', capacity: 2, equipment: ['Table', 'Scale'], isActive: true },
      { id: 2, name: 'Surgery Room', type: 'surgery', capacity: 4, equipment: ['Operating Table', 'Anesthesia Machine'], isActive: true },
      { id: 3, name: 'X-Ray Room', type: 'xray', capacity: 2, equipment: ['X-Ray Machine'], isActive: true },
    ]);

    setEquipment([
      { id: 1, name: 'X-Ray Machine', type: 'Diagnostic', status: 'operational', assignedRoom: 'X-Ray Room', nextMaintenance: '2026-03-15' },
      { id: 2, name: 'Ultrasound', type: 'Diagnostic', status: 'operational', assignedRoom: 'Exam Room 1', nextMaintenance: '2026-04-20' },
      { id: 3, name: 'Anesthesia Machine', type: 'Surgery', status: 'maintenance', assignedRoom: 'Surgery Room', nextMaintenance: '2026-02-20' },
    ]);
  }, []);

  const getRoleColor = (role) => {
    const roleObj = roles.find(r => r.value === role);
    return roleObj?.color || 'gray';
  };

  const UserManagementTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage staff accounts, roles, and permissions</p>
        </div>
        <button
          onClick={() => setShowAddUser(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left py-4 px-6 font-bold text-gray-700">Name</th>
              <th className="text-left py-4 px-6 font-bold text-gray-700">Email</th>
              <th className="text-left py-4 px-6 font-bold text-gray-700">Role</th>
              <th className="text-left py-4 px-6 font-bold text-gray-700">Permissions</th>
              <th className="text-left py-4 px-6 font-bold text-gray-700">Specialization</th>
              <th className="text-center py-4 px-6 font-bold text-gray-700">Status</th>
              <th className="text-center py-4 px-6 font-bold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-6 font-semibold text-gray-900">
                  {user.firstName} {user.lastName}
                </td>
                <td className="py-4 px-6 text-gray-600">{user.email}</td>
                <td className="py-4 px-6">
                  <span className={`px-3 py-1 bg-${getRoleColor(user.role)}-100 text-${getRoleColor(user.role)}-700 rounded-full text-sm font-bold`}>
                    {roles.find(r => r.value === user.role)?.label}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex gap-1">
                    {user.permissions.map(perm => (
                      <span key={perm} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                        {perm}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-4 px-6 text-gray-600">{user.specialization || '-'}</td>
                <td className="py-4 px-6 text-center">
                  {user.isActive ? (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">Active</span>
                  ) : (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold">Inactive</span>
                  )}
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-red-50 rounded-lg text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">Edit User</h3>
              <button onClick={() => setEditingUser(null)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    value={editingUser.firstName}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={editingUser.lastName}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                <select
                  value={editingUser.role}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Permissions</label>
                <div className="flex gap-3">
                  {permissions.map(perm => (
                    <label key={perm} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingUser.permissions.includes(perm)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm font-semibold capitalize">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Specialization</label>
                <input
                  type="text"
                  value={editingUser.specialization || ''}
                  placeholder="e.g., Surgery, Cardiology"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 flex items-center justify-center gap-2">
                  <Save className="w-5 h-5" />
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const PracticeSettingsTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Practice Settings</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Home className="w-5 h-5" />
            Basic Information
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Practice Name</label>
              <input
                type="text"
                defaultValue="VetPro Clinic"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                defaultValue="contact@vetpro.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                defaultValue="+421 XXX XXX XXX"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
              <textarea
                rows="3"
                defaultValue="123 Main Street, Bratislava, Slovakia"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Opening Hours */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Opening Hours
          </h3>

          <div className="space-y-3">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
              <div key={day} className="flex items-center gap-4">
                <div className="w-28 font-semibold text-gray-700">{day}</div>
                <input
                  type="time"
                  defaultValue="08:00"
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="time"
                  defaultValue="18:00"
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4" />
                  <span className="text-sm">Closed</span>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 flex items-center gap-2">
        <Save className="w-5 h-5" />
        Save Settings
      </button>
    </div>
  );

  const RoomsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Rooms & Facilities</h2>
        <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Room
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map(room => (
          <div key={room.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{room.name}</h3>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-blue-50 rounded-lg text-blue-600">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-red-50 rounded-lg text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Type:</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold capitalize">
                  {room.type}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Capacity:</span>
                <span className="font-semibold">{room.capacity} people</span>
              </div>

              <div>
                <span className="text-sm text-gray-600 block mb-2">Equipment:</span>
                <div className="flex flex-wrap gap-2">
                  {room.equipment.map((eq, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {eq}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t">
                {room.isActive ? (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">Active</span>
                ) : (
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold">Inactive</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const EquipmentTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Equipment Management</h2>
        <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Equipment
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left py-4 px-6 font-bold text-gray-700">Equipment Name</th>
              <th className="text-left py-4 px-6 font-bold text-gray-700">Type</th>
              <th className="text-left py-4 px-6 font-bold text-gray-700">Status</th>
              <th className="text-left py-4 px-6 font-bold text-gray-700">Assigned Room</th>
              <th className="text-left py-4 px-6 font-bold text-gray-700">Next Maintenance</th>
              <th className="text-center py-4 px-6 font-bold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {equipment.map(eq => (
              <tr key={eq.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-6 font-semibold text-gray-900">{eq.name}</td>
                <td className="py-4 px-6 text-gray-600">{eq.type}</td>
                <td className="py-4 px-6">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    eq.status === 'operational' ? 'bg-green-100 text-green-700' :
                    eq.status === 'maintenance' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {eq.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-gray-600">{eq.assignedRoom}</td>
                <td className="py-4 px-6 text-gray-600">{eq.nextMaintenance}</td>
                <td className="py-4 px-6">
                  <div className="flex items-center justify-center gap-2">
                    <button className="p-2 hover:bg-blue-50 rounded-lg text-blue-600">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-red-50 rounded-lg text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600">Manage users, settings, and practice configuration</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 mb-6 overflow-x-auto">
          <div className="flex">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-6 py-4 font-semibold transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Icon className="w-5 h-5" />
                    <span>{tab.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'users' && <UserManagementTab />}
          {activeTab === 'practice' && <PracticeSettingsTab />}
          {activeTab === 'rooms' && <RoomsTab />}
          {activeTab === 'equipment' && <EquipmentTab />}
          {activeTab === 'eshop' && <div className="text-center p-8">E-Shop Settings Coming Soon</div>}
          {activeTab === 'physical-shop' && <div className="text-center p-8">Physical Shop Settings Coming Soon</div>}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;

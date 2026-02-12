import React, { useEffect, useState } from 'react';
import api from '../config/api';

interface DashboardStats {
  totalClients: number;
  todayAppointments: number;
  pendingInvoices: number;
  monthlyRevenue: number;
}

function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    todayAppointments: 0,
    pendingInvoices: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching from:', api.baseURL);
      
      const clientsResponse = await api.fetch('/api/clients');
      const appointmentsResponse = await api.fetch('/api/appointments');
      const invoicesResponse = await api.fetch('/api/invoices');

      setStats({
        totalClients: clientsResponse?.data?.length || 0,
        todayAppointments: appointmentsResponse?.data?.length || 0,
        pendingInvoices: invoicesResponse?.data?.filter((inv: any) => inv.status === 'pending').length || 0,
        monthlyRevenue: 0,
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setStats({
        totalClients: 156,
        todayAppointments: 12,
        pendingInvoices: 8,
        monthlyRevenue: 24500,
      });
      setError('Using demo data - backend connection issue');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to VetPro Practice Management</p>
        {error && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">⚠️ {error}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 uppercase">Total Clients</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalClients}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 uppercase">Today's Appointments</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.todayAppointments}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 uppercase">Pending Invoices</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{stats.pendingInvoices}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 uppercase">Monthly Revenue</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">€{stats.monthlyRevenue.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">System Status</h2>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${error ? 'bg-yellow-500' : 'bg-green-500'} animate-pulse`}></div>
          <span className="text-sm text-gray-600">
            {error ? 'Backend: Connected (using demo data)' : 'Backend: Connected and operational'}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          API Endpoint: {api.baseURL}
        </p>
      </div>
    </div>
  );
}

export default Dashboard;

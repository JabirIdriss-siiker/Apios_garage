import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Building2, LogOut, LayoutDashboard, Settings } from 'lucide-react';
import SuperAdminOverview from './dashboard/SuperAdminOverview';

export default function SuperAdminDashboard() {
  const { signOut, profile } = useAuth();
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'settings'>('dashboard');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <Building2 className="w-8 h-8 text-orange-500 mr-3" />
                <h1 className="text-xl font-bold">Apios Garage</h1>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-1">
                <button
                  onClick={() => setCurrentPage('dashboard')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${currentPage === 'dashboard' ? 'bg-orange-500/20 text-orange-400' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>
                {/* Placeholder for future settings page */}
                {/* 
                 <button
                    onClick={() => setCurrentPage('settings')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                        currentPage === 'settings' ? 'bg-orange-500/20 text-orange-400' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                >
                    <Settings className="w-4 h-4" />
                    <span>Paramètres</span>
                </button> 
                */}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-white">{profile?.full_name}</span>
                <span className="text-xs text-orange-400">Super Admin</span>
              </div>
              <div className="h-8 w-px bg-slate-700 mx-2"></div>
              <button
                onClick={() => signOut()}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {currentPage === 'dashboard' && <SuperAdminOverview />}
        {/* currentPage === 'settings' && <SuperAdminSettings /> */}
      </main>
    </div>
  );
}

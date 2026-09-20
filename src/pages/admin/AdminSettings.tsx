import React, { useState } from 'react';
import { useApp } from '../../store/AppContext';
import {
  Settings,
  Building2,
  Clock,
  Radio,
  Phone,
  RotateCcw,
  CheckCircle2,
  Save,
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const { currentCollege, resetAllData } = useApp();

  const [campusName, setCampusName] = useState(currentCollege.name);
  const [gpsInterval, setGpsInterval] = useState('3');
  const [emergencyPhone, setEmergencyPhone] = useState('(555) 911-APEX');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Campus Transit Settings & Policies</h2>
        <p className="text-xs text-slate-500">
          Institutional configuration, telemetry polling intervals, and safety dispatch hotline
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Campus settings successfully updated.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Campus Institution Profile
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Institution Name
            </label>
            <input
              type="text"
              value={campusName}
              onChange={(e) => setCampusName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Multi-Campus Code Identifier
            </label>
            <input
              type="text"
              disabled
              value={currentCollege.shortCode}
              className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-500 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Driver GPS Telemetry Rate
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Driver Phone Ping Interval
            </label>
            <select
              value={gpsInterval}
              onChange={(e) => setGpsInterval(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            >
              <option value="2">2 seconds (High precision, high battery usage)</option>
              <option value="3">3 seconds (Recommended campus standard)</option>
              <option value="5">5 seconds (Conserve driver mobile data)</option>
              <option value="10">10 seconds (Low bandwidth mode)</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Safety & Dispatch Contacts
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Direct Emergency Hotline
            </label>
            <input
              type="text"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>

      {/* Demo Reset Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-slate-600" />
          Reset Demo Environment
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Restore initial mock buses, routes, completed trips, and notifications to original
          defaults. Clears all offline location queues in browser storage.
        </p>
        <button
          onClick={resetAllData}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
        >
          Reset Demo State
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { Link } from 'react-router-dom';
import { Bus, Navigation, Clock, Shield, ArrowRight } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-slate-100 px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Bus className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">CampusMove</span>
          </div>
          <Link
            to="/login"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            Get Started
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Smart Campus Transit
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Real-time campus bus tracking
            <br />
            <span className="text-blue-600">made simple and reliable.</span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-lg mx-auto leading-relaxed">
            Track campus shuttles in real time. Know exactly when your bus arrives. Built for students, drivers, and campus transport administrators.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/login" className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2">
              Sign In <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login" className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors">
              Create Account
            </Link>
          </div>
        </div>

        <div className="mt-16 sm:mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto w-full px-4">
          <div className="text-center p-5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <Navigation className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">Live GPS Tracking</h3>
            <p className="text-xs text-slate-500">See bus locations updated in real time from driver devices.</p>
          </div>
          <div className="text-center p-5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">Accurate Arrival Times</h3>
            <p className="text-xs text-slate-500">Live ETAs based on current GPS position and route data.</p>
          </div>
          <div className="text-center p-5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">Safety First</h3>
            <p className="text-xs text-slate-500">Emergency alerts and campus-wide notifications for everyone.</p>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-100 py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Bus className="w-3.5 h-3.5" />
            <span>CampusMove — Smart campus bus tracking and transport management.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

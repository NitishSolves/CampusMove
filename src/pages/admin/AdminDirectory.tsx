import React, { useState } from 'react';
import { useApp } from '../../store/AppContext';
import { SearchInput } from '../../components/common/Inputs';
import {
  Users,
  Bus,
  GraduationCap,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const AdminDirectory: React.FC = () => {
  const { currentCollege, buses } = useApp();
  const [tab, setTab] = useState<'DRIVERS' | 'STUDENTS'>('DRIVERS');
  const [searchTerm, setSearchTerm] = useState('');

  // Sample drivers roster
  const drivers = [
    {
      id: 'drv_1',
      name: 'Marcus Vance',
      email: 'marcus.vance@transit.apex.edu',
      phone: '(555) 234-8901',
      cdlNumber: 'CDL-CA-98214',
      status: 'ON_DUTY',
      assignedBus: 'BUS-104',
      hoursThisWeek: 34.5,
    },
    {
      id: 'drv_2',
      name: 'Elena Rostova',
      email: 'elena.rostova@transit.apex.edu',
      phone: '(555) 234-8902',
      cdlNumber: 'CDL-CA-44912',
      status: 'ON_DUTY',
      assignedBus: 'BUS-101',
      hoursThisWeek: 38.0,
    },
    {
      id: 'drv_3',
      name: 'David Kim',
      email: 'david.kim@transit.apex.edu',
      phone: '(555) 234-8903',
      cdlNumber: 'CDL-CA-11209',
      status: 'STANDBY',
      assignedBus: 'BUS-103',
      hoursThisWeek: 28.0,
    },
    {
      id: 'drv_4',
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@transit.apex.edu',
      phone: '(555) 234-8904',
      cdlNumber: 'CDL-CA-77610',
      status: 'OFF_DUTY',
      assignedBus: 'None (Relief Pool)',
      hoursThisWeek: 40.0,
    },
  ];

  // Sample students roster
  const students = [
    {
      id: 'std_1',
      name: 'Alex Chen',
      email: 'alex.chen@apex.edu',
      studentId: 'ASU-2024-8891',
      department: 'Computer Science & Software Eng.',
      passStatus: 'ACTIVE',
      joined: 'Aug 2024',
    },
    {
      id: 'std_2',
      name: 'Maya Patel',
      email: 'maya.patel@apex.edu',
      studentId: 'ASU-2023-4102',
      department: 'Biomedical Sciences',
      passStatus: 'ACTIVE',
      joined: 'Aug 2023',
    },
    {
      id: 'std_3',
      name: 'Jordan Rivera',
      email: 'jordan.rivera@apex.edu',
      studentId: 'ASU-2025-1029',
      department: 'Business Administration',
      passStatus: 'ACTIVE',
      joined: 'Jan 2025',
    },
    {
      id: 'std_4',
      name: 'Chloe Tremblay',
      email: 'chloe.t@apex.edu',
      studentId: 'ASU-2024-3382',
      department: 'Architecture & Urban Design',
      passStatus: 'ACTIVE',
      joined: 'Aug 2024',
    },
  ];

  const filteredDrivers = drivers.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.assignedBus.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.cdlNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Personnel & Commuter Directory</h2>
          <p className="text-xs text-slate-500">
            Certified campus drivers and registered student transit pass holders
          </p>
        </div>

        <div className="w-full sm:w-72">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder={`Search ${tab.toLowerCase()} by name, ID...`}
          />
        </div>
      </div>

      {/* Roster Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-bold">
        <button
          onClick={() => setTab('DRIVERS')}
          className={`pb-3 px-4 flex items-center gap-2 cursor-pointer border-b-2 transition-colors ${
            tab === 'DRIVERS'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bus className="w-4 h-4" />
          <span>Campus Shuttle Drivers ({drivers.length})</span>
        </button>
        <button
          onClick={() => setTab('STUDENTS')}
          className={`pb-3 px-4 flex items-center gap-2 cursor-pointer border-b-2 transition-colors ${
            tab === 'STUDENTS'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Student Commuters ({students.length})</span>
        </button>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        {tab === 'DRIVERS' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Driver Name</th>
                  <th className="py-3 px-4">Duty Status</th>
                  <th className="py-3 px-4">Assigned Vehicle</th>
                  <th className="py-3 px-4">CDL License</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4 text-right">Hours Logged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredDrivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{driver.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{driver.email}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          driver.status === 'ON_DUTY'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : driver.status === 'STANDBY'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {driver.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {driver.assignedBus}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {driver.cdlNumber}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{driver.phone}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {driver.hoursThisWeek} hrs
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Institutional ID</th>
                  <th className="py-3 px-4">Academic Department</th>
                  <th className="py-3 px-4">Campus Pass Status</th>
                  <th className="py-3 px-4 text-right">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{student.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{student.email}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                      {student.studentId}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {student.department}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        VALIDATED PASS
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right text-slate-500">
                      {student.joined}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

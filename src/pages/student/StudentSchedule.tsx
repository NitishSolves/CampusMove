import React, { useState, useContext } from "react";
import { AppContext } from "../../store/AppContext";
import { Calendar, Clock, MapPin } from "lucide-react";

export function StudentSchedule() {
  const { buses } = useContext(AppContext);
  const [selectedDay, setSelectedDay] = useState<string>("Monday");
  const [selectedRoute, setSelectedRoute] = useState<string>("");

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  // Mock schedules (in production, fetch from API)
  const schedules = [
    {
      id: "sch_1",
      routeName: "North Campus",
      busNumber: "BUS-01",
      departureTime: "08:00 AM",
      arrivalTime: "08:30 AM",
      operatingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },
    {
      id: "sch_2",
      routeName: "South Campus",
      busNumber: "BUS-02",
      departureTime: "09:00 AM",
      arrivalTime: "09:45 AM",
      operatingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },
    {
      id: "sch_3",
      routeName: "East Wing",
      busNumber: "BUS-03",
      departureTime: "07:30 AM",
      arrivalTime: "08:15 AM",
      operatingDays: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
    },
    {
      id: "sch_4",
      routeName: "Library Shuttle",
      busNumber: "BUS-04",
      departureTime: "10:00 AM",
      arrivalTime: "10:20 AM",
      operatingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },
  ];

  const filteredSchedules = schedules.filter((schedule) => {
    const matchesDay = schedule.operatingDays.includes(selectedDay);
    const matchesRoute =
      !selectedRoute || schedule.routeName === selectedRoute;
    return matchesDay && matchesRoute;
  });

  const routes = [...new Set(schedules.map((s) => s.routeName))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Bus Schedule</h1>
          </div>
          <p className="text-gray-600">
            View departure times for all campus bus routes
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Day Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Day
              </label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {days.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            {/* Route Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filter by Route (Optional)
              </label>
              <select
                value={selectedRoute}
                onChange={(e) => setSelectedRoute(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Routes</option>
                {routes.map((route) => (
                  <option key={route} value={route}>
                    {route}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Schedules List */}
        {filteredSchedules.length > 0 ? (
          <div className="space-y-4">
            {filteredSchedules.map((schedule) => (
              <div
                key={schedule.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Route Info */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      {schedule.routeName}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Bus: <span className="font-semibold">{schedule.busNumber}</span>
                    </p>
                  </div>

                  {/* Times */}
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-600">Departure</p>
                        <p className="text-lg font-semibold text-gray-800">
                          {schedule.departureTime}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-xs text-gray-600">Arrival</p>
                        <p className="text-lg font-semibold text-gray-800">
                          {schedule.arrivalTime}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">
              No schedules available for {selectedDay}
              {selectedRoute && ` on ${selectedRoute}`}
            </p>
          </div>
        )}

        {/* Legend */}
        <div className="mt-8 bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">💡 Tip:</span> Schedules may vary
            during holidays and special events. Check the mobile app for
            real-time updates.
          </p>
        </div>
      </div>
    </div>
  );
}

export default StudentSchedule;


import React, { useState, useContext } from "react";
import { AppContext } from "../../store/AppContext";
import { MessageSquare, Send, AlertCircle } from "lucide-react";

export function StudentFeedback() {
  const { buses } = useContext(AppContext);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    busId: "",
    type: "complaint",
  });
  const [submitted, setSubmitted] = useState(false);

  // Mock complaints (in production, fetch from API)
  const complaints = [
    {
      id: "cmp_1",
      title: "Bus was 15 minutes late",
      description: "Bus BUS-01 on North Campus route was delayed",
      status: "RESOLVED",
      adminResponse: "We apologize for the delay. Driver was stuck in traffic.",
      createdAt: "2024-09-20",
    },
    {
      id: "cmp_2",
      title: "Air conditioning not working",
      description: "AC malfunction on Bus BUS-03",
      status: "IN_PROGRESS",
      adminResponse: "Maintenance team has been notified. ETA: 2 days",
      createdAt: "2024-09-18",
    },
    {
      id: "cmp_3",
      title: "Driver was rude",
      description: "Driver was impolite to passengers",
      status: "OPEN",
      adminResponse: null,
      createdAt: "2024-09-15",
    },
  ];

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
      alert("Please fill in all fields");
      return;
    }

    try {
      // In production: POST /api/complaints
      // const response = await fetch("/api/complaints", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(formData),
      // });

      console.log("Submitting complaint:", formData);
      setSubmitted(true);
      setFormData({ title: "", description: "", busId: "", type: "complaint" });

      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      console.error("Error submitting complaint:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-yellow-100 text-yellow-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-800">
              Feedback & Complaints
            </h1>
          </div>
          <p className="text-gray-600">
            Share your experience and help us improve our service
          </p>
        </div>

        {/* Success Message */}
        {submitted && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Thank you! Your feedback has been submitted.
          </div>
        )}

        {/* Submit Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Submit Your Feedback
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Bus was late, Driver was rude"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide details about your experience"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              ></textarea>
            </div>

            {/* Bus Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bus (Optional)
                </label>
                <select
                  name="busId"
                  value={formData.busId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select a bus</option>
                  {buses.map((bus) => (
                    <option key={bus.id} value={bus.id}>
                      {bus.busNumber}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="complaint">Complaint</option>
                  <option value="suggestion">Suggestion</option>
                  <option value="praise">Praise</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Send className="w-5 h-5" />
              Submit Feedback
            </button>
          </form>
        </div>

        {/* Complaints History */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Your Feedback History
          </h2>

          {complaints.length > 0 ? (
            <div className="space-y-4">
              {complaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {complaint.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {complaint.createdAt}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                        complaint.status
                      )}`}
                    >
                      {complaint.status}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-gray-700 mb-3">{complaint.description}</p>

                  {/* Admin Response */}
                  {complaint.adminResponse && (
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                      <p className="text-sm font-semibold text-blue-900 mb-1">
                        Admin Response:
                      </p>
                      <p className="text-sm text-blue-800">
                        {complaint.adminResponse}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No feedback submitted yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentFeedback;

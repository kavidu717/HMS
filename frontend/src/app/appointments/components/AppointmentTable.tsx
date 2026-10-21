
"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";

type Patient = {
  id: string;
  firstName: string;
  lastName: string;
};

type Doctor = {
  id: string;
  firstName: string;
  lastName: string;
};

type Appointment = {
  id: string;
  appointmentNumber: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  reason?: string | null;
  notes?: string | null;
  status: "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  patient?: Patient;
  doctor?: Doctor;
};

type AppointmentTableProps = {
  onView?: (appointment: Appointment) => void;
  onReschedule?: (appointment: Appointment) => void;
  onUpdateStatus?: (appointment: Appointment) => void;
};

export default function AppointmentTable({
  onView,
  onReschedule,
  onUpdateStatus,
}: AppointmentTableProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/appointments");

      const data = response.data?.data;

      if (!Array.isArray(data)) {
        throw new Error("Invalid appointments response");
      }

      setAppointments(data);
    } catch (err) {
      console.error("Failed to fetch appointments:", err);
      setError("Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAppointments();
  }, []);

  if (loading) {
    return <p>Loading appointments...</p>;
  }

  if (error) {
    return (
      <div>
        <p>{error}</p>
        <button type="button" onClick={() => void fetchAppointments()}>
          Retry
        </button>
      </div>
    );
  }

  if (appointments.length === 0) {
    return <p>No appointments found.</p>;
  }

  return (
    <div>
      <h2>Appointments</h2>

      <button type="button" onClick={() => void fetchAppointments()}>
        Refresh
      </button>

      <table>
        <thead>
          <tr>
            <th>Appointment Number</th>
            <th>Patient</th>
            <th>Doctor</th>
            <th>Date</th>
            <th>Start Time</th>
            <th>End Time</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {appointments.map((appointment) => (
            <tr key={appointment.id}>
              <td>{appointment.appointmentNumber}</td>

              <td>
                {appointment.patient
                  ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
                  : appointment.patientId}
              </td>

              <td>
                {appointment.doctor
                  ? `${appointment.doctor.firstName} ${appointment.doctor.lastName}`
                  : appointment.doctorId}
              </td>

              <td>
                {new Date(appointment.appointmentDate).toLocaleDateString()}
              </td>

              <td>{appointment.startTime}</td>

              <td>{appointment.endTime}</td>

              <td>{appointment.status}</td>

              <td>
                <button
                  type="button"
                  onClick={() => onView?.(appointment)}
                >
                  View
                </button>

                <button
                  type="button"
                  disabled={["CANCELLED", "COMPLETED", "NO_SHOW"].includes(
                    appointment.status,
                  )}
                  onClick={() => onReschedule?.(appointment)}
                >
                  Reschedule
                </button>

                <button
                  type="button"
                  disabled={["CANCELLED", "COMPLETED", "NO_SHOW"].includes(
                    appointment.status,
                  )}
                  onClick={() => onUpdateStatus?.(appointment)}
                >
                  Update Status
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
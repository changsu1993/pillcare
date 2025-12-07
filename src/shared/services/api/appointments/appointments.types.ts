/**
 * Form data type for creating/updating appointments
 */
export interface AppointmentFormData {
  title: string;
  hospital_name: string;
  appointment_date: Date | string;
  notes?: string;
}

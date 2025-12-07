// Types
export type { AppointmentFormData } from './appointments.types';

// API functions
export {
  getAppointments,
  getAppointment,
  getParentAppointments,
  getUpcomingAppointments,
  createAppointment,
  createAppointmentForParent,
  updateAppointment,
  deleteAppointment,
} from './appointments.api';

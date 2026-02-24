import { User, Booking, Location } from "../types";

const USER_KEY = "auto-planner-user";
const BOOKINGS_KEY = "auto-planner-bookings";

export const saveUser = (user: User) => {
  localStorage.setItem(USER_KEY, user);
};

export const getUser = (): User | null => {
  return localStorage.getItem(USER_KEY) as User | null;
};

export const clearUser = () => {
  localStorage.removeItem(USER_KEY);
};

export const saveBookings = (bookings: Booking[]) => {
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
};

export const getBookings = (): Booking[] => {
  const stored = localStorage.getItem(BOOKINGS_KEY);
  if (!stored) return [];
  return JSON.parse(stored);
};

export const getLocationForDate = (bookings: Booking[], date: string): Location => {
  // Vind de boeking voor deze specifieke datum
  const booking = bookings.find(b => b.date === date);
  if (booking) {
    return booking.endLocation;
  }
  
  // Als er geen boeking is voor deze datum, kijk naar de vorige datum
  const targetDate = new Date(date);
  const sorted = [...bookings]
    .filter(b => new Date(b.date) < targetDate)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  if (sorted.length > 0) {
    return sorted[0].endLocation;
  }
  
  return "Zwolle"; // Default startlocatie
};

export const getCurrentLocation = (bookings: Booking[]): Location => {
  const today = new Date().toISOString().split('T')[0];
  return getLocationForDate(bookings, today);
};
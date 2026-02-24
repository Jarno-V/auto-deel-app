import type { Booking } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function fetchBookings(from: string, to: string): Promise<Booking[]> {
  const res = await fetch(`${API_URL}/api/bookings?from=${from}&to=${to}`);
  if (!res.ok) {
    throw new Error("Failed to fetch bookings");
  }
  return res.json();
}

export async function createBooking(
  booking: Omit<Booking, "id">
): Promise<Booking> {
  const res = await fetch(`${API_URL}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(booking),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to create booking" }));
    throw new Error(error.error || "Failed to create booking");
  }
  return res.json();
}

export async function deleteBooking(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/bookings/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("Failed to delete booking");
  }
}

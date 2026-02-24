import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { MapPin, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { getBookings, saveBookings } from "../utils/storage";
import type { Booking, User } from "../types";

interface BookingsListProps {
  bookings: Booking[];
  currentUser: User;
  onBookingsChange: () => void;
}

export function BookingsList({
  bookings,
  currentUser,
  onBookingsChange,
}: BookingsListProps) {
  const handleDelete = (id: string) => {
    const allBookings = getBookings();
    const updated = allBookings.filter((b) => b.id !== id);
    saveBookings(updated);
    onBookingsChange();
  };

  return (
    <div className="space-y-3">
      {bookings.map((booking) => {
        const isMyBooking = booking.user === currentUser;
        const date = new Date(booking.date);

        return (
          <Card
            key={booking.id}
            className={`p-4 ${
              isMyBooking
                ? "border-l-4 border-l-blue-500 bg-blue-50/50"
                : "border-l-4 border-l-gray-300"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {/* Gebruiker */}
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      isMyBooking
                        ? "bg-blue-600 text-white"
                        : "bg-gray-600 text-white"
                    }`}
                  >
                    {booking.user}
                  </span>
                </div>

                {/* Datum */}
                <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                  <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {format(date, "EEEE d MMMM yyyy", { locale: nl })}
                  </span>
                </div>

                {/* Eindlocatie */}
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 flex-shrink-0 text-gray-500" />
                  <span className="text-gray-600">Auto eindigt in</span>
                  <span className="font-medium text-gray-700">
                    {booking.endLocation}
                  </span>
                </div>
              </div>

              {/* Delete knop (alleen voor eigen boekingen) */}
              {isMyBooking && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(booking.id)}
                  className="flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
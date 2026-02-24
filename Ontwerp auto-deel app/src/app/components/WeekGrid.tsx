import { format, addDays, startOfDay, isSameDay } from "date-fns";
import { nl } from "date-fns/locale";
import { Car } from "lucide-react";
import { Card } from "./ui/card";
import type { Booking, Location, User } from "../types";
import { getLocationForDate } from "../utils/storage";

interface WeekGridProps {
  bookings: Booking[];
  currentUser: User;
  onDeleteBooking?: (id: string) => void;
}

const locations: Location[] = ["Zwolle", "Ede", "Anders"];

export function WeekGrid({ bookings, currentUser, onDeleteBooking }: WeekGridProps) {
  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  const getBookingForDateAndLocation = (date: Date, location: Location) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return bookings.find(
      (b) => b.date === dateStr && b.endLocation === location
    );
  };

  const isCarAtLocation = (date: Date, location: Location) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const currentLocation = getLocationForDate(bookings, dateStr);
    return currentLocation === location;
  };

  return (
    <div>
      {/* Header met locaties */}
      <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-2 mb-2">
        <div className="w-16" /> {/* Spacer voor dag labels */}
        {locations.map((location) => (
          <div key={location} className="text-center">
            <div className="font-semibold text-gray-900">{location}</div>
          </div>
        ))}
      </div>

      {/* Grid met dagen */}
      <div className="space-y-2">
        {days.map((day) => {
          const isToday = isSameDay(day, today);
          
          return (
            <div key={day.toISOString()} className="grid grid-cols-[auto_1fr_1fr_1fr] gap-2 items-center">
              {/* Dag label */}
              <div className="w-16 text-left">
                <div className="text-xs text-gray-500 uppercase">
                  {format(day, "EEE", { locale: nl })}
                </div>
                <div className={`text-sm font-semibold ${isToday ? "text-blue-600" : "text-gray-900"}`}>
                  {format(day, "d MMM", { locale: nl })}
                </div>
              </div>

              {/* Locatie cellen voor deze dag */}
              {locations.map((location) => {
                const booking = getBookingForDateAndLocation(day, location);
                const hasCarHere = isCarAtLocation(day, location);

                return (
                  <Card
                    key={location}
                    className={`h-20 flex items-center justify-center relative transition-all ${
                      isToday ? "ring-2 ring-blue-400" : ""
                    } ${
                      booking
                        ? booking.user === "Jarno"
                          ? "bg-blue-100 border-blue-300"
                          : "bg-green-100 border-green-300"
                        : "bg-gray-50"
                    }`}
                  >
                    {/* Auto icoon als de auto hier staat */}
                    {hasCarHere && (
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg z-10">
                        <Car className="w-4 h-4 text-white" />
                      </div>
                    )}

                    {/* Booking info */}
                    {booking && (
                      <div className="text-center px-1 w-full">
                        <div className="font-semibold text-sm">
                          {booking.user}
                        </div>
                        {booking.user === currentUser && onDeleteBooking && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteBooking(booking.id);
                            }}
                            className="absolute top-1 right-1 w-1.5 h-1.5 bg-gray-300 rounded-full hover:bg-red-500 transition-colors"
                            title="Verwijderen"
                            aria-label="Boeking verwijderen"
                          />
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="mt-4 flex items-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded" />
          <span>Jarno</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-100 border border-green-300 rounded" />
          <span>Sven</span>
        </div>
        <div className="flex items-center gap-1">
          <Car className="w-3 h-3 text-blue-600" />
          <span>Auto staat hier</span>
        </div>
      </div>
    </div>
  );
}
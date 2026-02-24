import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { format, addDays } from "date-fns";
import { Car, Plus, LogOut, Calendar } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { getUser, clearUser, getCurrentLocation } from "../utils/storage";
import { fetchBookings, deleteBooking } from "../api/bookings";
import { POLLING_INTERVAL } from "../utils/constants";
import { NewBookingDialog } from "./NewBookingDialog";
import { WeekGrid } from "./WeekGrid";
import type { Booking } from "../types";

export function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getUser());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentLocation, setCurrentLocation] = useState<"Zwolle" | "Ede" | "Anders">("Zwolle");
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);

  const today = new Date();
  const fromDate = format(today, "yyyy-MM-dd");
  const toDate = format(addDays(today, 6), "yyyy-MM-dd");

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const data = await fetchBookings(fromDate, toDate);
        setBookings(data);
        setCurrentLocation(getCurrentLocation(data));
      } catch (error) {
        console.error("Failed to load bookings:", error);
      }
    };

    loadBookings();
    const interval = setInterval(loadBookings, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [fromDate, toDate]);

  const handleLogout = () => {
    clearUser();
    navigate("/");
  };

  const handleBookingAdded = () => {
    setIsNewBookingOpen(false);
    fetchBookings(fromDate, toDate)
      .then((data) => {
        setBookings(data);
        setCurrentLocation(getCurrentLocation(data));
      })
      .catch(console.error);
  };

  const handleDeleteBooking = async (id: string) => {
    try {
      await deleteBooking(id);
      setBookings((prev) => prev.filter((b) => b.id !== id));
      setCurrentLocation(getCurrentLocation(bookings.filter((b) => b.id !== id)));
    } catch (error) {
      console.error("Failed to delete booking:", error);
    }
  };

  if (!user) return null;

  const now = new Date();
  const todayStr = format(now, "yyyy-MM-dd");
  const upcomingBookings = bookings
    .filter((b) => b.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  const myUpcomingBookings = upcomingBookings.filter((b) => b.user === user);
  const otherUpcomingBookings = upcomingBookings.filter((b) => b.user !== user);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold">Hoi {user}!</h1>
              <p className="text-sm text-gray-500">Auto Planner</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4 pb-24">
        {/* Snelle actie */}
        <Button
          onClick={() => setIsNewBookingOpen(true)}
          className="w-full h-14 bg-green-600 hover:bg-green-700 text-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nieuwe Boeking
        </Button>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="text-2xl font-bold text-blue-600">{myUpcomingBookings.length}</div>
            <div className="text-sm text-gray-600">Jouw boekingen</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-gray-600">{otherUpcomingBookings.length}</div>
            <div className="text-sm text-gray-600">Van {user === "Jarno" ? "Sven" : "Jarno"}</div>
          </Card>
        </div>

        {/* Week Grid */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Aankomende 7 Dagen</h3>
          </div>
          <WeekGrid 
            bookings={upcomingBookings} 
            currentUser={user} 
            onDeleteBooking={handleDeleteBooking} 
          />
        </div>
      </div>

      {/* New Booking Dialog */}
      <NewBookingDialog
        open={isNewBookingOpen}
        onOpenChange={setIsNewBookingOpen}
        currentUser={user}
        currentLocation={currentLocation}
        onBookingAdded={handleBookingAdded}
      />
    </div>
  );
}
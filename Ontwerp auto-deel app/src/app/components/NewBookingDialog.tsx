import { useState } from "react";
import { format, addDays, startOfDay } from "date-fns";
import { nl } from "date-fns/locale";
import { Calendar, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { createBooking } from "../api/bookings";
import type { User, Location } from "../types";

interface NewBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: User;
  currentLocation: Location;
  onBookingAdded: () => void;
}

export function NewBookingDialog({
  open,
  onOpenChange,
  currentUser,
  onBookingAdded,
}: NewBookingDialogProps) {
  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [endLocation, setEndLocation] = useState<Location>("Zwolle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDate) {
      alert("Selecteer een dag");
      return;
    }

    try {
      await createBooking({
        user: currentUser,
        date: selectedDate,
        endLocation,
      });

      setSelectedDate("");
      setEndLocation("Zwolle");
      onBookingAdded();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create booking");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nieuwe Boeking</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Dag selectie */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">Selecteer dag</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {days.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const isSelected = selectedDate === dateStr;
                
                return (
                  <Button
                    key={dateStr}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => setSelectedDate(dateStr)}
                    className="h-14 flex flex-col items-center justify-center"
                  >
                    <span className="text-xs opacity-80">
                      {format(day, "EEE", { locale: nl })}
                    </span>
                    <span className="font-semibold">
                      {format(day, "d MMM", { locale: nl })}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Eindlocatie */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">Auto eindigt in</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={endLocation === "Zwolle" ? "default" : "outline"}
                onClick={() => setEndLocation("Zwolle")}
                className="h-12"
              >
                Zwolle
              </Button>
              <Button
                type="button"
                variant={endLocation === "Ede" ? "default" : "outline"}
                onClick={() => setEndLocation("Ede")}
                className="h-12"
              >
                Ede
              </Button>
              <Button
                type="button"
                variant={endLocation === "Anders" ? "default" : "outline"}
                onClick={() => setEndLocation("Anders")}
                className="h-12"
              >
                Anders
              </Button>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Annuleren
            </Button>
            <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
              Opslaan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
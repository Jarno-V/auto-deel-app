export type User = 'Jarno' | 'Sven';
export type Location = 'Zwolle' | 'Ede' | 'Anders';

export interface Booking {
  id: string;
  user: User;
  date: string;
  endLocation: Location;
  created_at?: string;
}

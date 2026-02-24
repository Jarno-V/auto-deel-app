import express from 'express';
import cors from 'cors';
import { getDatabase, initDatabase } from './db';
import { User, Location, Booking } from './types';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

const isValidUser = (user: string): user is User => {
  return user === 'Jarno' || user === 'Sven';
};

const isValidLocation = (loc: string): loc is Location => {
  return loc === 'Zwolle' || loc === 'Ede' || loc === 'Anders';
};

app.get('/api/bookings', (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ error: 'Missing from or to query params' });
  }

  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, user, date, end_location as endLocation, created_at
    FROM bookings
    WHERE date >= ? AND date <= ?
    ORDER BY date ASC
  `);

  const bookings = stmt.all(from, to) as Booking[];
  res.json(bookings);
});

app.post('/api/bookings', (req, res) => {
  const { user, date, endLocation } = req.body;

  if (!user || !isValidUser(user)) {
    return res.status(400).json({ error: 'Invalid user' });
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format (use YYYY-MM-DD)' });
  }
  if (!endLocation || !isValidLocation(endLocation)) {
    return res.status(400).json({ error: 'Invalid endLocation' });
  }

  const db = getDatabase();
  const id = crypto.randomUUID();
  const stmt = db.prepare(`
    INSERT INTO bookings (id, user, date, end_location)
    VALUES (?, ?, ?, ?)
  `);

  stmt.run(id, user, date, endLocation);

  const newBooking: Booking = { id, user, date, endLocation };
  res.status(201).json(newBooking);
});

app.delete('/api/bookings/:id', (req, res) => {
  const { id } = req.params;

  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM bookings WHERE id = ?');
  const result = stmt.run(id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  res.status(204).send();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

initDatabase();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

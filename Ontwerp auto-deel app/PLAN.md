# Auto Planner Backend - Implementatie Plan

## Overzicht

Deze guide beschrijft hoe je de backend voor de Auto Planner app stap-voor-stap kunt implementeren. De backend wordt gehost als een losse Node.js + Express + SQLite applicatie in Docker.

**Frontend**: Bestaande Vite + React Router app (ongewijzigd)
**Backend**: Node.js + Express + SQLite
**Real-time**: Polling (10 seconden)
**Hosting**: Docker (self-hosted)

---

## Architectuur

```
┌─────────────────────┐     ┌─────────────────────┐
│   Frontend (Vite)   │────▶│  Backend (Node.js )  │
│ localhost:5173     │     │  localhost:3000     │
└─────────────────────┘     └──────────┬──────────┘
                                        │
                                   ┌─────▼─────┐
                                   │  SQLite   │
                                   │  Database │
                                   └───────────┘
```

---

## Keuzes & Beslissingen

| Onderwerp | Keuze | Reden |
|-----------|-------|-------|
| Backend stack | Node.js + Express | Jouw voorkeur |
| Database | SQLite | Jouw voorkeur, eenvoudig |
| Hosting | Docker (self-hosted) | Jouw voorkeur |
| Real-time | Polling (10s) | Eenvoudiger dan WebSockets, volstaat |
| Auth | Simple (X-User header) | Trust-based systeem, geen wachtwoorden |
| Frontend | Ongewijzigd (Vite) | Geen migratie naar Next.js |
| Backend repo | Losse repo | Jouw voorkeur |

---

## STAP 1: Backend Repo Opzetten

### Doel
Basis project structuur aanmaken met Node.js, TypeScript en Docker.

### Taken
1. **Maak nieuwe GitHub/GitLab repo**: `auto-planner-backend`
2. **Clone lokaal**:
   ```bash
   git clone <repo-url> auto-planner-backend
   cd auto-planner-backend
   ```

3. **Initialiseer Node.js project**:
   ```bash
   npm init -y
   ```

4. **Installeer dependencies** (productie):
   ```bash
   npm install express cors better-sqlite3 uuid
   ```

5. **Installeer dependencies** (development):
   ```bash
   npm install -D typescript @types/node @types/express @types/cors @types/better-sqlite3 @types/uuid nodemon ts-node
   ```

6. **Maak `tsconfig.json`**:
   ```json
   {
     "compilerOptions": {
       "target": "ES2020",
       "module": "commonjs",
       "outDir": "./dist",
       "rootDir": "./src",
       "strict": true,
       "esModuleInterop": true,
       "skipLibCheck": true,
       "forceConsistentCasingInFileNames": true
     },
     "include": ["src/**/*"]
   }
   ```

7. **Update `package.json` scripts**:
   ```json
   {
     "scripts": {
       "dev": "nodemon src/index.ts",
       "build": "tsc",
       "start": "node dist/index.js"
     }
   }
   ```

8. **Maak basis `Dockerfile`**:
   ```dockerfile
   FROM node:20-alpine
   
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY dist/ ./dist/
   
   EXPOSE 3000
   
   CMD ["node", "dist/index.js"]
   ```

### ✅ Checklist
- [ ] Repo aangemaakt
- [ ] Dependencies geïnstalleerd
- [ ] TypeScript geconfigureerd
- [ ] Dockerfile aanwezig

---

## STAP 2: Database Schema

### Doel
SQLite database opzetten met bookings tabel.

### Taken
1. **Maak `src/db.ts`**:
   ```typescript
   import Database from 'better-sqlite3';
   import path from 'path';
   
   const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'bookings.db');
   const db = new Database(dbPath);
   
   db.exec(`
     CREATE TABLE IF NOT EXISTS bookings (
       id TEXT PRIMARY KEY,
       user TEXT NOT NULL CHECK(user IN ('Jarno', 'Sven')),
       date TEXT NOT NULL,
       end_location TEXT NOT NULL CHECK(end_location IN ('Zwolle', 'Ede', 'Anders')),
       created_at TEXT DEFAULT CURRENT_TIMESTAMP
     );
   
     CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
   `);
   
   export default db;
   ```

2. **Update `Dockerfile`** voor volume mount:
   ```dockerfile
   # Zorg dat data directory bestaat
   RUN mkdir -p /app/data
   ```

### ✅ Checklist
- [ ] Database module aangemaakt
- [ ] Tabel en index aangemaakt

---

## STAP 3: API Endpoints

### Doel
REST API implementeren voor CRUD operaties op boekingen.

### Endpoint Overzicht

| Endpoint | Method | Beschrijving |
|----------|--------|--------------|
| `/api/bookings` | GET | `?from=YYYY-MM-DD&to=YYYY-MM-DD` - haal boekingen op |
| `/api/bookings` | POST | `{ user, date, endLocation }` - maak boeking |
| `/api/bookings/:id` | DELETE | verwijder boeking |

### Validatie Regels
- `user`: alleen "Jarno" of "Sven"
- `date`: YYYY-MM-DD formaat
- `endLocation`: "Zwolle", "Ede", of "Anders"

### Auth
Simpele header `X-User: Jarno` of `X-User: Sven` (trust-based, geen tokens).

### Taken
1. **Maak `src/types.ts`**:
   ```typescript
   export type User = 'Jarno' | 'Sven';
   export type Location = 'Zwolle' | 'Ede' | 'Anders';
   
   export interface Booking {
     id: string;
     user: User;
     date: string; // YYYY-MM-DD
     endLocation: Location;
     created_at?: string;
   }
   ```

2. **Maak `src/index.ts`**:
   ```typescript
   import express from 'express';
   import cors from 'cors';
   import { v4 as uuidv4 } from 'uuid';
   import db from './db';
   import { User, Location, Booking } from './types';
   
   const app = express();
   const PORT = process.env.PORT || 3000;
   
   app.use(cors());
   app.use(express.json());
   
   // Helper: validate user
   const isValidUser = (user: string): user is User => {
     return user === 'Jarno' || user === 'Sven';
   };
   
   // Helper: validate location
   const isValidLocation = (loc: string): loc is Location => {
     return loc === 'Zwolle' || loc === 'Ede' || loc === 'Anders';
   };
   
   // GET /api/bookings?from=YYYY-MM-DD&to=YYYY-MM-DD
   app.get('/api/bookings', (req, res) => {
     const { from, to } = req.query;
     
     if (!from || !to) {
       return res.status(400).json({ error: 'Missing from or to query params' });
     }
   
     const stmt = db.prepare(`
       SELECT id, user, date, end_location as endLocation, created_at
       FROM bookings
       WHERE date >= ? AND date <= ?
       ORDER BY date ASC
     `);
   
     const bookings = stmt.all(from, to) as Booking[];
     res.json(bookings);
   });
   
   // POST /api/bookings
   app.post('/api/bookings', (req, res) => {
     const { user, date, endLocation } = req.body;
   
     // Validation
     if (!user || !isValidUser(user)) {
       return res.status(400).json({ error: 'Invalid user' });
     }
     if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
       return res.status(400).json({ error: 'Invalid date format (use YYYY-MM-DD)' });
     }
     if (!endLocation || !isValidLocation(endLocation)) {
       return res.status(400).json({ error: 'Invalid endLocation' });
     }
   
     const id = uuidv4();
     const stmt = db.prepare(`
       INSERT INTO bookings (id, user, date, end_location)
       VALUES (?, ?, ?, ?)
     `);
   
     stmt.run(id, user, date, endLocation);
   
     const newBooking: Booking = { id, user, date, endLocation };
     res.status(201).json(newBooking);
   });
   
   // DELETE /api/bookings/:id
   app.delete('/api/bookings/:id', (req, res) => {
     const { id } = req.params;
   
     const stmt = db.prepare('DELETE FROM bookings WHERE id = ?');
     const result = stmt.run(id);
   
     if (result.changes === 0) {
       return res.status(404).json({ error: 'Booking not found' });
     }
   
     res.status(204).send();
   });
   
   app.listen(PORT, () => {
     console.log(`Server running on port ${PORT}`);
   });
   ```

3. **Update `Dockerfile`** om te bouwen met TypeScript:
   ```dockerfile
   FROM node:20-alpine
   
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm ci
   
   COPY . .
   RUN npm run build
   
   EXPOSE 3000
   
   CMD ["node", "dist/index.js"]
   ```

### ✅ Checklist
- [ ] Types gedefinieerd
- [ ] GET endpoint werkend
- [ ] POST endpoint werkend
- [ ] DELETE endpoint werkend
- [ ] Validatie geïmplementeerd

---

## STAP 4: Frontend API Integratie

### Doel
Frontend aanpassen om met backend te communiceren i.p.v. localStorage.

### Taken
1. **Maak `src/app/api/bookings.ts`** in de frontend repo:
   ```typescript
   import { Booking } from '../types';
   
   const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
   
   export async function fetchBookings(from: string, to: string): Promise<Booking[]> {
     const res = await fetch(`${API_URL}/api/bookings?from=${from}&to=${to}`);
     if (!res.ok) throw new Error('Failed to fetch bookings');
     return res.json();
   }
   
   export async function createBooking(booking: Omit<Booking, 'id'>): Promise<Booking> {
     const res = await fetch(`${API_URL}/api/bookings`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(booking),
     });
     if (!res.ok) throw new Error('Failed to create booking');
     return res.json();
   }
   
   export async function deleteBooking(id: string): Promise<void> {
     const res = await fetch(`${API_URL}/api/bookings/${id}`, {
       method: 'DELETE',
     });
     if (!res.ok) throw new Error('Failed to delete booking');
   }
   ```

2. **Pas `src/app/components/Dashboard.tsx` aan**:
   - Importeer `fetchBookings` van de nieuwe API
   - Vervang `getBookings()` door `fetchBookings(from, to)`
   - Voeg polling toe:
   ```typescript
   useEffect(() => {
     const loadBookings = async () => {
       const data = await fetchBookings(fromDate, toDate);
       setBookings(data);
     };
   
     loadBookings();
     const interval = setInterval(loadBookings, 10000); // Poll every 10s
     return () => clearInterval(interval);
   }, [fromDate, toDate]);
   ```

3. **Pas `src/app/components/NewBookingDialog.tsx` aan**:
   - Importeer `createBooking` en `deleteBooking`
   - Vervang localStorage calls door API calls
   - Na create/delete: roep `onSuccess()` callback aan voor refetch

4. **Maak `.env` bestand in frontend root**:
   ```
   VITE_API_URL=http://localhost:3000
   ```

5. **Configureer CORS in backend** voor ontwikkeling:
   ```typescript
   app.use(cors({
     origin: ['http://localhost:5173', 'http://localhost:4173'],
     credentials: true
   }));
   ```

### ✅ Checklist
- [ ] API client aangemaakt
- [ ] Dashboard aangepast met polling
- [ ] NewBookingDialog aangepast
- [ ] Environment variable ingesteld

---

## STAP 5: Docker Compose

### Doel
Productie deployment met Docker Compose.

### Taken
1. **Maak `docker-compose.yml`** in backend root:
   ```yaml
   version: '3.8'
   
   services:
     backend:
       build: .
       ports:
         - "3000:3000"
       volumes:
         - ./data:/app/data
       environment:
         - PORT=3000
         - DB_PATH=/app/data/bookings.db
       restart: unless-stopped
   ```

2. **Update `.gitignore`**:
   ```
   node_modules/
   dist/
   data/
   *.db
   *.db-journal
   ```

3. **Build en run**:
   ```bash
   docker-compose up --build
   ```

### ✅ Checklist
- [ ] docker-compose.yml aangemaakt
- [ ] .gitignore bijgewerkt
- [ ] Getest met docker-compose up

---

## Referentie: Database Schema

```sql
CREATE TABLE bookings (
  id TEXT PRIMARY KEY,
  user TEXT NOT NULL CHECK(user IN ('Jarno', 'Sven')),
  date TEXT NOT NULL,
  end_location TEXT NOT NULL CHECK(end_location IN ('Zwolle', 'Ede', 'Anders')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bookings_date ON bookings(date);
```

---

## Referentie: API Responses

### GET /api/bookings?from=2024-02-23&to=2024-03-01
```json
[
  {
    "id": "uuid-1234",
    "user": "Jarno",
    "date": "2024-02-24",
    "endLocation": "Ede",
    "created_at": "2024-02-23T10:00:00.000Z"
  }
]
```

### POST /api/bookings
Request:
```json
{
  "user": "Jarno",
  "date": "2024-02-24",
  "endLocation": "Ede"
}
```
Response (201):
```json
{
  "id": "uuid-1234",
  "user": "Jarno",
  "date": "2024-02-24",
  "endLocation": "Ede"
}
```

### DELETE /api/bookings/:id
Response: 204 No Content

---

## Test Scenario

1. Start backend: `docker-compose up --build`
2. Start frontend: `npm run dev`
3. Open frontend in browser (localhost:5173)
4. Selecteer gebruiker (Jarno of Sven)
5. Maak een boeking via de UI
6. Controleer of boeking verschijnt in database:
   ```bash
   docker exec -it <container> sqlite3 /app/data/bookings.db "SELECT * FROM bookings;"
   ```
7. Open tweede browser/incognito, login als andere gebruiker
8. Wacht 10 seconden - boeking zou moeten verschijnen (polling)
9. Verwijder boeking - andere gebruiker ziet update na 10s

---

## Volgorde Uitvoering

1. ✅ **Plan** (deze documentatie)
2. 🔄 **Sessie 1**: Stap 1 - Backend Repo Opzetten
3. ⏳ **Sessie 2**: Stap 2 - Database Schema
4. ⏳ **Sessie 3**: Stap 3 - API Endpoints
5. ⏳ **Sessie 4**: Stap 4 - Frontend API Integratie
6. ⏳ **Sessie 5**: Stap 5 - Docker Compose

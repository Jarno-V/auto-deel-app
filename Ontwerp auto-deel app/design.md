# Jarno & Sven's Auto Planner - Frontend Design Documentatie

## 1. Concept & Intentie

### De Kern
Een hyper-efficiënte, mobile-first PWA voor twee vrienden (Jarno & Sven) die één auto delen. De app elimineert agenda-conflicten en locatieverwarring door een slim "estafette-systeem" zonder in te leveren op snelheid of gebruiksgemak.

### Het Probleem dat We Oplossen
- **Dubbele boekingen**: Beide gebruikers willen de auto op hetzelfde moment
- **Locatie verwarring**: Niemand weet of de auto in Zwolle of Ede staat
- **Gebrek aan overzicht**: Geen inzicht in beschikbaarheid op lange termijn
- **Communicatie overhead**: Constant WhatsApp-verkeer om af te stemmen

### De Oplossing
Een "single source of truth" met deze kernprincipes:
- **Zero-Friction**: Nieuwe boeking maken duurt <10 seconden
- **Visual-First**: Eén blik is genoeg om te zien waar de auto staat
- **Trust-Based**: Geen goedkeuringsprocessen, gewoon vrijheid-blijheid
- **Location-Aware**: Estafette-logica voorkomt fysiek onmogelijke scenario's

---

## 2. Design Filosofie

### Mobile-First & Simpel
- **Grote touch targets**: Alle knoppen minimaal 48px hoog voor makkelijk tikken
- **Minimale input**: Maximaal 3 taps voor een nieuwe boeking
- **Visuele hiërarchie**: Het belangrijkste (waar staat de auto?) krijgt de meeste ruimte
- **Geen overbodig geklik**: Direct naar het dashboard na login

### Vertrouwen & Autonomie
- **Geen notificaties**: Pull-based systeem, gebruikers checken zelf de app
- **Instant delete**: Je eigen boekingen met één druk annuleren
- **No limits**: Onbeperkt boeken, geen quota's of restricties
- **Persistent login**: "Smart Cookie" systeem onthoudt wie je bent

### Speed Over Everything
- **Single Page App gevoel**: React Router voor instant navigatie
- **Optimistische UI**: Geen wachttijden, direct feedback
- **Minimale schermen**: Login → Dashboard, dat's het

---

## 3. Data Structuur

### User Type
```typescript
type User = "Jarno" | "Sven";
```
- Simpele string literal, slechts 2 mogelijke waarden
- Geen complexe user objecten nodig (high-trust omgeving)

### Location Type
```typescript
type Location = "Zwolle" | "Ede" | "Anders";
```
- 3 mogelijke eindlocaties
- "Anders" voor edge cases (bijv. auto bij garage, andere stad)

### Booking Type
```typescript
interface Booking {
  id: string;           // Unieke identifier
  user: User;           // Wie heeft geboekt
  date: string;         // YYYY-MM-DD format (volledige dag)
  endLocation: Location; // Waar eindigt de auto
}
```

**Belangrijke Design Keuzes:**
- **Geen starttijd/eindtijd**: Boekingen zijn per volledige dag, niet per uur
- **Geen startLocation veld**: Deze wordt berekend op basis van de vorige boeking (estafette-logica)
- **Geen description**: Overbodig - snelheid gaat voor
- **Simpele ID**: Timestamp is voldoende voor dit use case

---

## 4. Estafette-Logica (De Magie!)

### Het Concept
De auto is een fysiek object dat niet kan teleporteren. Als de auto vandaag in Ede eindigt, kan een boeking morgen niet starten vanaf Zwolle.

### Implementatie
```typescript
// Huidige locatie = eindlocatie van de laatste boeking vóór vandaag
export const getLocationForDate = (bookings: Booking[], date: string): Location => {
  // 1. Check: Is er een boeking OP deze datum?
  const booking = bookings.find(b => b.date === date);
  if (booking) return booking.endLocation;
  
  // 2. Kijk naar de dichtstbijzijnde boeking vóór deze datum
  const sorted = bookings
    .filter(b => new Date(b.date) < new Date(date))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  
  if (sorted.length > 0) return sorted[0].endLocation;
  
  // 3. Fallback: Default startlocatie
  return "Zwolle";
};
```

**Praktisch Voorbeeld:**
- Ma: Jarno boekt, eindigt in Ede
- Di: Auto staat nu in Ede (auto-icoon toont dit)
- Wo: Sven wil boeken → auto start automatisch vanuit Ede
- Wo: Sven eindigt in Zwolle
- Do: Auto staat nu in Zwolle

---

## 5. Component Architectuur

### Login Component (`/src/app/components/Login.tsx`)
**Doel**: Eenmalige gebruikersselectie met persistent login

**Features:**
- 2 grote knoppen: "IK BEN JARNO" en "IK BEN SVEN"
- Opslaan in localStorage (key: `auto-planner-user`)
- Auto-redirect naar dashboard als al ingelogd
- Geen wachtwoorden, geen security theater (high-trust!)

**UX Flow:**
1. Eerste bezoek → Selecteer je naam
2. Opgeslagen in cookie/localStorage
3. Volgende bezoek → Direct naar dashboard

### Dashboard Component (`/src/app/components/Dashboard.tsx`)
**Doel**: Central command center - overzicht + quick actions

**Layout (top to bottom):**
1. **Header**: Naam gebruiker + logout knop
2. **Quick Action**: Grote groene "Nieuwe Boeking" knop (most common action)
3. **Stats Cards**: 2x aantal boekingen (jouw vs andere gebruiker)
4. **Week Grid**: Het hart van de app (zie hieronder)

**State Management:**
- Bookings ophalen bij mount
- Re-fetch na nieuwe boeking
- Realtime sync (wordt in backend geïmplementeerd)

### WeekGrid Component (`/src/app/components/WeekGrid.tsx`)
**Doel**: Visuele tijdlijn van 7 dagen × 3 locaties

**Grid Structuur:**
```
        | Zwolle | Ede | Anders |
--------|--------|-----|--------|
Ma 24/2 |  [🚗]  |     |        |
Di 25/2 |        | [J] |        |
Wo 26/2 |  [S]   |     |        |
Do 27/2 |  [🚗]  |     |        |
...
```

**Visual Indicators:**
- 🚗 (blauw icoon) = Auto staat HIER op deze dag
- Blauwe achtergrond = Jarno's boeking
- Groene achtergrond = Sven's boeking
- Grijze achtergrond = Geen boeking
- Blauwe ring = Vandaag

**Mobile-Optimized:**
- Verticale scroll (geen horizontaal scrollen)
- Grid: `grid-cols-[auto_1fr_1fr_1fr]`
- Touch-friendly spacing (gap-2 = 8px)

### NewBookingDialog Component (`/src/app/components/NewBookingDialog.tsx`)
**Doel**: Ultra-simpel boekingsformulier

**Input Methode:**
1. **Dag Selectie**: 7 knoppen (vandaag + 6 dagen vooruit)
   - Grote touch targets (h-14)
   - Duidelijke labels (bijv. "Ma 24 Feb")
   - Selected state = filled button

2. **Eindlocatie**: 3 knoppen (Zwolle / Ede / Anders)
   - Grid van 3 gelijke kolommen
   - Toggle buttons
   - Selected state = filled button

3. **Submit**: Opslaan + Annuleren knoppen

**Wat NIET in het formulier zit:**
- ❌ Starttijd/eindtijd (te complex)
- ❌ Startlocatie tonen (overbodig, wordt berekend)
- ❌ Omschrijving veld (snelheid > details)
- ❌ Recurring options (komt later eventueel)

**Form Validation:**
- Alleen required: dag + eindlocatie
- No edge case handling (trust-based)

---

## 6. User Flows

### Flow 1: Eerste Gebruik
```
1. Open app
2. Zie login screen
3. Tap "IK BEN JARNO"
4. → Direct naar dashboard
5. Zie week grid (nog leeg)
6. Tap "Nieuwe Boeking"
7. Selecteer dag (bijv. morgen)
8. Selecteer eindlocatie (bijv. Ede)
9. Tap "Opslaan"
10. Zie boeking verschijnen in grid
11. Auto-icoon toont waar auto morgen staat
```

### Flow 2: Dagelijks Gebruik
```
1. Open app
2. → Direct naar dashboard (persistent login)
3. Scan week grid visueel
4. Zie waar auto vandaag/morgen staat
5. Klaar! (meeste bezoekers doen alleen dit)
```

### Flow 3: Nieuwe Boeking Maken
```
1. Vanaf dashboard
2. Tap grote groene knop
3. Tap dag (bijv. "Vr 28 Feb")
4. Tap locatie (bijv. "Zwolle")
5. Tap "Opslaan"
6. Dialog sluit
7. Grid update met nieuwe boeking
8. Klaar! (±8 seconden total)
```

### Flow 4: Boeking Annuleren
```
1. Open dashboard
2. Scroll naar je boeking in lijst/grid
3. Tap prullenbak icoon
4. Instant delete (geen confirmatie)
5. Grid update
```

---

## 7. Storage & State

### LocalStorage Keys
```
auto-planner-user      → "Jarno" | "Sven"
auto-planner-bookings  → JSON array van Booking[]
```

**Huidige Implementatie:**
- Frontend-only met localStorage
- Werkt per device
- Geen sync tussen gebruikers

**Backend Vereiste:**
- Vervang localStorage door API calls
- Real-time sync tussen beide gebruikers
- Conflict detection (2 mensen boeken zelfde dag)
- Persistentie in database

---

## 8. Color System & Branding

### User Colors
- **Jarno**: Blauw (#2563eb = blue-600)
  - Boekingen: bg-blue-100, border-blue-300
  - Buttons: bg-blue-600
  
- **Sven**: Groen (#16a34a = green-600)
  - Boekingen: bg-green-100, border-green-300
  - Buttons: bg-green-600

### System Colors
- **Primary Action**: Groen (nieuwe boeking = positieve actie)
- **Auto Indicator**: Blauw (neutraal, systeem)
- **Vandaag Highlight**: Blauw ring
- **Destructive**: Rood (delete)

### Accessibility
- Niet alleen kleur: ook labels ("Jarno", "Sven")
- Touch targets min. 44px
- Hoog contrast tekst

---

## 9. PWA Eigenschappen

### Manifest (`/public/manifest.json`)
```json
{
  "name": "Auto Planner - Jarno & Sven",
  "short_name": "Auto Planner",
  "display": "standalone",
  "theme_color": "#2563eb",
  "orientation": "portrait"
}
```

### Gewenste PWA Features
- **Installable**: Voeg toe aan home screen
- **Offline-First**: Service worker cachen
- **Fast Load**: <2s initial load
- **App-Like**: Geen browser chrome in standalone mode

---

## 10. Backend Requirements

### Database Schema

**Users Table** (optioneel, kan hardcoded blijven)
```sql
id: string (PK)
name: "Jarno" | "Sven"
created_at: timestamp
```

**Bookings Table** (essentieel!)
```sql
id: uuid (PK)
user_id: string (FK naar Users, of direct "Jarno"/"Sven")
date: date (YYYY-MM-DD)
end_location: "Zwolle" | "Ede" | "Anders"
created_at: timestamp
updated_at: timestamp
```

**Indexes:**
- `date` (voor snelle queries per week)
- `user_id + date` (voor user-specifieke queries)

### API Endpoints

**GET /bookings**
- Query params: `?from=2024-02-23&to=2024-03-01` (7 dagen)
- Response: `Booking[]`
- Used by: Dashboard op mount

**POST /bookings**
- Body: `{ user, date, endLocation }`
- Response: Created `Booking`
- Validation: Check geen dubbele boeking op zelfde datum

**DELETE /bookings/:id**
- Params: booking ID
- Authorization: Check of booking van deze user is
- Response: 204 No Content

### Real-time Sync
**Critical Feature!**

Wanneer Jarno een boeking maakt, moet Sven dit DIRECT zien zonder refresh.

**Opties:**
1. **Supabase Realtime** (preferred)
   - Postgres LISTEN/NOTIFY
   - WebSocket subscriptions
   
2. **Polling** (fallback)
   - Elke 10 seconden GET /bookings
   - Simpel maar niet instant

3. **WebSockets** (custom)
   - Socket.io of native WS
   - More complex

### Conflict Handling

**Scenario:** Beide gebruikers boeken exact dezelfde dag tegelijk

**Oplossing:**
- Database constraint: UNIQUE(date, user_id)?
- Of: Toestaan maar visueel tonen conflict
- Trust-based: Ze lossen het zelf op (bellen elkaar)

**Recommendation:** Laat multiple bookings op 1 dag toe, maar toon warning in UI:
"Let op: Sven heeft deze dag ook geboekt"

---

## 11. Frontend → Backend Integratie

### Stap 1: Vervang Storage Layer
```typescript
// Huidige implementatie (localStorage)
import { getBookings, saveBookings } from "../utils/storage";

// Nieuwe implementatie (API)
import { getBookings, createBooking, deleteBooking } from "../api/bookings";
```

### Stap 2: API Client
```typescript
// /src/app/api/bookings.ts
const API_URL = process.env.VITE_API_URL;

export async function getBookings(from: string, to: string): Promise<Booking[]> {
  const res = await fetch(`${API_URL}/bookings?from=${from}&to=${to}`);
  return res.json();
}

export async function createBooking(booking: Omit<Booking, 'id'>): Promise<Booking> {
  const res = await fetch(`${API_URL}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking),
  });
  return res.json();
}

export async function deleteBooking(id: string): Promise<void> {
  await fetch(`${API_URL}/bookings/${id}`, { method: 'DELETE' });
}
```

### Stap 3: Real-time Subscriptions
```typescript
// Dashboard.tsx
useEffect(() => {
  const subscription = supabase
    .channel('bookings')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'bookings' },
      () => loadBookings()
    )
    .subscribe();

  return () => subscription.unsubscribe();
}, []);
```

---

## 12. Edge Cases & Toekomstige Features

### Edge Cases (huidige versie handelt af)
✅ Eerste boeking ooit → Auto start in Zwolle (default)
✅ Geen boekingen vandaag → Auto staat waar laatste boeking eindigde
✅ Dag zonder boeking tussen 2 boekingen → Auto blijft op plek van vorige boeking

### Edge Cases (nog niet afgehandeld)
⚠️ Beide gebruikers boeken zelfde dag → Tonen, geen blokkade
⚠️ "Anders" locatie → Auto kan volgende dag niet starten (location unknown)
⚠️ Verleden boekingen editen → Impact on estafette chain

### Toekomstige Features (niet nu implementeren!)
- 🔄 Recurring bookings (elke dinsdag)
- 📊 Statistieken (wie gebruikt meest)
- 🔔 Opt-in notificaties
- ✏️ Boekingen editen (nu alleen delete)
- 📝 Notities bij boeking
- 🚗 Support voor meerdere auto's
- 👥 Support voor >2 gebruikers
- 📅 Maandoverzicht naast weekoverzicht

---

## 13. Samenvatting voor Backend Developer

**Wat je moet bouwen:**

1. **Database**
   - `bookings` tabel met: id, user, date, end_location, timestamps
   - Indexes op date fields

2. **REST API**
   - GET /bookings (met date range filter)
   - POST /bookings (create)
   - DELETE /bookings/:id

3. **Real-time Sync**
   - Supabase Realtime of WebSocket
   - Frontend subscribed op changes

4. **Validatie**
   - Date format: YYYY-MM-DD
   - User: alleen "Jarno" of "Sven"
   - Location: "Zwolle", "Ede", of "Anders"

**Wat je NIET moet doen:**
- ❌ Complexe auth (trust-based systeem)
- ❌ Conflictpreventie (trust-based)
- ❌ Rate limiting (slechts 2 users)
- ❌ Email/notificaties (pull-based)

**Technologie Suggesties:**
- **Supabase** (easiest, heeft alles ingebouwd)
- **Firebase** (alternatief, ook real-time)
- **Custom**: Node.js + PostgreSQL + Socket.io

**Test Scenario:**
1. Jarno opent app op telefoon A
2. Sven opent app op telefoon B
3. Jarno maakt boeking voor morgen, eindigt in Ede
4. → Sven's scherm update INSTANT
5. → Week grid toont auto-icoon bij Ede voor morgen
6. Sven maakt boeking voor overmorgen
7. → Auto start automatisch vanuit Ede
8. → Jarno's scherm update INSTANT

---

**Succes met de backend implementatie! 🚗**

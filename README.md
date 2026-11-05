# ShikshaBD — Bangladesh Educational Institutes

A full-stack web application for browsing 101,797+ educational institutes in Bangladesh, with teacher details, MPO status, contact info, and statistics.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS v4 + Recharts + Leaflet |
| Backend | Python FastAPI + Uvicorn |
| Database | SQLite (bd_education.db) |
| Analytics | Java (built-in HTTP server) |

## Running

Double-click `start.bat` — launches all services:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000 (docs: http://localhost:8000/docs)
- Java Analytics: http://localhost:8090

## Features

- Browse 101,797 institutes (primary + post-primary)
- Filter by level, division, district, type, management
- Search by name or ID (with autocomplete)
- Institute detail with Overview + Teachers + Location tabs
- Location tab with Google Maps embed
- Teacher directory (1,548,083 teachers, searchable)
- Statistics dashboard with charts
- Global search (Ctrl+K)
- Favorites, Compare, Export CSV
- Map view (Google Maps)
- Similar institutes
- Teacher search within institute
- Toast notifications
- Breadcrumbs, share button
- Skeleton loaders, error boundary
- Dark mode
- Mobile responsive
- Print-friendly

## Data Sources

- BANBEIS 2024 (36,253 post-primary institutes)
- IPEMIS (65,544 primary schools)
- BANBEIS Teachers Database (1,548,083 teachers from 32,331 institutes)
- salman-anik/Bangladesh-education-institutes (38,304 institutes)
- data.gov.bd datasets
- GitHub institute lists

## Data Integrity

- 0 missing critical fields
- 0 duplicate EIINs
- 0 false data (teacher_count only on post-primary)
- 0 mismatches between teacher_count and actual teachers
- All from official BANBEIS/IPEMIS sources
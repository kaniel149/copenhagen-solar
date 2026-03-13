# Solar Intelligence Platform — Design Document

**Date:** 2026-03-13
**Author:** Kaniel Tordjman / TM Energy
**Status:** Approved

## Purpose

Build the world's best solar prospecting tool, with POC on southern Thailand:
Ko Phangan → Koh Samui → Surat Thani.

Two parallel capabilities:
1. **Rooftop Solar** — identify buildings with solar potential, calculate ROI, generate proposals
2. **Community Solar Land** — find land plots suitable for solar farms based on proximity to electrical grid

## Architecture

```
Frontend: React + TypeScript + Vite + Tailwind + MapLibre GL JS + Framer Motion
Backend: Supabase (PostGIS + Auth + RLS + Edge Functions)
Deploy: Vercel + GitHub Pages (GIS data)
Data: Overpass API (OSM) + existing datasets + NASA POWER API
```

## Data Layers

### Layer 1: Grid Infrastructure (NEW — must collect first)
- **Source:** OpenStreetMap via Overpass API + existing power-grid-map.html data
- **Coverage:** Ko Phangan, Koh Samui, Surat Thani province
- **Features:** Substations, transmission lines (115kV/230kV), distribution lines (33kV/22kV), transformers, submarine cables, towers/poles
- **Format:** GeoJSON, one file per feature type
- **Updates:** Manual re-pull + community contributions

### Layer 2: Rooftop Buildings (EXISTING — migrate)
- **Source:** buildings_data.js (2,467 buildings on Ko Phangan)
- **Fields:** lat/lng, area, usable area, kWp, panel count, annual kWh, savings, EPC cost, solar score, priority grade, category, contact info
- **Expansion:** OSM building extraction for Samui + Surat Thani

### Layer 3: Land Plots (EXISTING — migrate)
- **Source:** CSV from thai_land_scraper (Ko Phangan + Koh Samui)
- **Fields:** title, location, price, size, listing link
- **Enhancement:** Grid proximity score (A/B/C/D), connection cost estimate

### Layer 4: Solar Irradiance
- **Source:** NASA POWER API (free, global)
- **Data:** GHI (Global Horizontal Irradiance) kWh/m2/day per location
- **Ko Phangan baseline:** 5.1 kWh/m2/day, ~320 sunny days/year

## UI Design

### Map View (Full-screen MapLibre)
- Satellite / Street / Hybrid toggle
- Layer toggles: Grid, Rooftops, Land, Buffer Zones
- Cluster view at low zoom, individual features at high zoom
- Click feature → sidebar with details

### Two Tabs
1. **Rooftops** — building list, solar score, filter by grade/category/size
2. **Community Solar** — land list, grid proximity score, filter by distance/price/size

### Sidebar (Click on feature)
- Property details (name, type, size, price)
- Solar calculation (kWp, annual yield, savings)
- Grid info (nearest substation, distance, connection cost estimate)
- Financial model (EPC cost, PPA rate, ROI, IRR, payback)
- Action buttons: Generate Proposal, Add to Pipeline, Contact Owner

### Filter Bar
- Region: Ko Phangan / Koh Samui / Surat Thani
- Type: Roof / Land
- Grid Proximity: A (≤500m) / B (500m-2km) / C (2-5km) / D (>5km)
- Size / Price / Solar Potential sliders
- Status: For Sale / For Rent / Private

### Buffer Zone Visualization
- Concentric circles around substations + lines
- 500m = Green (Grade A, cheap connection)
- 2km = Yellow (Grade B, medium cost)
- 5km = Orange (Grade C, expensive)
- Beyond = Red (Grade D, not recommended)

## Grid Proximity Scoring

| Grade | Distance to Grid | Est. Connection Cost | Recommendation |
|-------|------------------|---------------------|----------------|
| A | ≤500m from 33kV line or substation | ฿100-300K | Excellent — minimal infrastructure needed |
| B | 500m - 2km | ฿300K - 1M | Good — short line extension |
| C | 2km - 5km | ฿1-3M | Moderate — needs transformer + extension |
| D | >5km | ฿3M+ | Not recommended for most projects |

Distance calculated to nearest: substation > 33kV line > 22kV line > transformer

## Solar Calculation Engine

```
Input: roof_area (m²) OR land_area (m²)
usable_pct = 0.7 (roof) or 0.85 (land)
panel_area = 2.0 m² per panel (550W)
panel_count = floor(area * usable_pct / panel_area)
capacity_kWp = panel_count * 0.55
annual_kWh = capacity_kWp * irradiance * 365 * 0.80 (PR)
annual_savings_THB = annual_kWh * tariff_rate
epc_cost = capacity_kWp * 32000 (THB/kWp average)
payback_years = epc_cost / annual_savings_THB
```

## Phases

### Phase 0: Grid Data Collection
- Overpass API queries for 3 regions
- Merge with existing power-grid-map.html data
- Validate + clean → GeoJSON files
- Verify on Open Infrastructure Map

### Phase 1: Platform Build
- React + Vite scaffold
- MapLibre with all layers
- Dual tabs (Rooftops / Community Solar)
- Filter bar + sidebar
- Import existing data

### Phase 2: Smart Engine
- NASA POWER API integration
- PostGIS spatial queries (ST_Distance for grid proximity)
- Financial calculator
- PDF proposal generation

### Phase 3: CRM + Expansion
- 12-step value chain pipeline
- WhatsApp lead capture
- Multi-region config system

## Tech Decisions

- **MapLibre over Mapbox** — open source, no token limits, already used in project
- **PostGIS over client-side** — spatial queries at scale (ST_Distance, ST_Buffer, ST_Within)
- **No Google Solar API** — doesn't cover Thailand
- **NASA POWER API** — free, global irradiance data, reliable
- **Vanilla GeoJSON** — for grid data, not database (small enough, static)

## Existing Assets to Migrate

| Asset | Source File | Target |
|-------|------------|--------|
| 2,467 buildings | roof-scanner/buildings_data.js | Supabase table + map layer |
| Land plots KP | koh_phangan_lands_data.csv | Supabase table + map layer |
| Land plots Samui | thai_lands_data.csv | Supabase table + map layer |
| Grid data KP | power-grid-map.html (hard-coded) | GeoJSON + map layer |
| Research docs | research/*.md | Knowledge base reference |
| Brand/design | CSS vars, color palette | Tailwind config |
| Proposals | proposal.html template | React component |

## Success Criteria

1. Map loads with all layers in <3 seconds
2. Can toggle between 3 regions
3. Grid infrastructure visible with buffer zones
4. Click any property → see solar potential + grid distance
5. Community solar score (A-D) for every land plot
6. Generate PDF proposal from any property

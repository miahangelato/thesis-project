# Project Phoenix: Diabetes Risk Kiosk (Implementation Roadmap)

This guide outlines the step-by-step phases to build the **Cloud-Hybrid IoT Kiosk** from scratch.
**Target Architecture**: Render (Free Cloud) + Vercel (Free Frontend) + Mini PC (Edge AI) + Supabase (Free DB/Storage).

---

## Phase 1: Project Initialization & Structure
**Goal**: Create a clean, organized Monorepo structure.

- [x] **Step 1.1**: Initialize Git Repository
- [x] **Step 1.2**: Create Folder Structure
    ```text
    /thesis-project
      /backend-cloud    (Django Ninja - Deployed to Render Free Tier)
      /frontend-web     (Next.js 15 - Deployed to Vercel Free Tier)
      /edge-node        (FastAPI + OpenVINO - Deployed to Mini PC)
      /shared-models    (Scripts to sync models from S3)
    ```
- [x] **Step 1.3**: Set up Virtual Environments (Python) and Node Modules.

---

## Phase 2: The Cloud Backend (Render + Supabase)
**Goal**: Build the secure logic layer using 100% Free Tools.

- [x] **Step 2.1**: Initialize Django Project.
- [x] **Step 2.2**: Infrastructure Setup
    - [x] Setup **Supabase** (Free Postgres DB + Free Storage).
    - [x] Connect Django to Supabase URL.
- [x] **Step 2.3**: Implement Core APIs
    - [x] `POST /api/diagnose`: Receives encrypted risk data.
    - [x] `GET /api/hospitals`: Returns usage data/locations.
- [x] **Step 2.4**: Implement "Silent AI" (Gemini Pro)
    - [x] Google Gemini API integration
    - [x] Report Generator Service
- [ ] **Step 2.5**: Deploy to **Render** (Free Web Service).

---

## Phase 3: The Edge Node (Mini PC)
**Goal**: Build the local bridge for Hardware and AI.

- [ ] **Step 3.1**: Initialize FastAPI "Bridge" Project.
- [ ] **Step 3.2**: Hardware Integration
    - [ ] Integrate `digitalpersona-sdk` (Python wrapper).
    - [ ] Create `/scan` endpoint to trigger hardware.
- [ ] **Step 3.3**: AI Optimization (OpenVINO)
    - [ ] Script to convert `.h5` (TensorFlow) to `.xml` (OpenVINO).
    - [ ] Implement `inference_engine.py` using Intel Runtime.
- [ ] **Step 3.4**: Security Layer
    - [ ] Implement `encrypt_payload()` function.
    - [ ] Auto-wipe RAM after request.

---

## Phase 4: The Frontend (Vercel)
**Goal**: Build the touch-friendly, high-performance UI (referencing old UI).

- [ ] **Step 4.1**: Initialize Next.js 15 App.
- [ ] **Step 4.2**: Component Library (ShadCN/Radix).
- [ ] **Step 4.3**: Port UI Designs from `team3thesis` (Refactoring code).
- [ ] **Step 4.4**: Build Key Screens
    - [ ] Attract Screen (Video Loop).
    - [ ] Data Entry Form (Touch).
    - [ ] "Scanning..." Animation (Polling Edge Node).
    - [ ] Results Dashboard.

---

## Phase 5: Integration & Field Hardening
**Goal**: Connect the pieces and ensure offline safety.

- [ ] **Step 5.1**: Connect Frontend to Edge Node (`localhost:8000`).
- [ ] **Step 5.2**: Connect Edge Node to Cloud Backend (Railway).
- [ ] **Step 5.3**: Implement "Offline Fallback" Mode.
- [ ] **Step 5.4**: Create `STARTUP.bat` for One-Click Kiosk Launch.

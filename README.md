# SGDPS — Durga Puja Collection & Society Treasury Platform

A full-stack, enterprise-grade community collection and treasury management ecosystem built for housing societies and festival committees.

---

## 🏗️ Monorepo Architecture

This repository contains the complete ecosystem organized into 3 main subsystems:

```
SGDPS/
├── PujaCollectionTrackerAPI/   # .NET 10 Web API Backend (Clean Architecture + FastEndpoints + EF Core)
├── SGDPSWebsite/               # Admin & Treasury Web Portal (React 19 + TypeScript + Vite + Tailwind CSS)
└── SGDPSMobile/                # On-Field Collector Mobile App (Flutter + Provider + Material 3)
```

---

## 🌟 Key Components

### 1. ⚙️ `PujaCollectionTrackerAPI` (Backend)
- **Framework**: .NET 10, C# 13, FastEndpoints, MediatR, Entity Framework Core.
- **Database**: SQLite (Development) / SQL Server (Production).
- **Features**: JWT Cookie Authentication, Role-based Authorization (`Admin`, `Collector`), Real-Time GPS Tracking, Auto-Receipt Generation, Defaulter Tracking, CSV/Excel Exports.
- **Swagger / Scalar**: Available at `/swagger` and `/scalar/v1`.

### 2. 💻 `SGDPSWebsite` (Admin & Treasury Web Portal)
- **Stack**: React 19, TypeScript, Vite, Redux Toolkit Query (RTK Query), Tailwind CSS.
- **Theme**: Traditional Indian Festive Fintech (Saffron, Deep Maroon, Antique Gold, Warm Ivory).
- **Features**:
  - Interactive Residential Block Grid (Tower & Floor Matrix)
  - Real-Time Financial Dashboard & Recharts Analytics
  - Collector Provisioning & Performance Monitoring
  - Expense Ledger & Category Analysis
  - Single-Click WhatsApp / PDF Receipt Generation

### 3. 📱 `SGDPSMobile` (Field Collector Android/iOS App)
- **Stack**: Flutter 3, Dart, Provider state management, Material 3.
- **Theme**: Traditional Indian Festive Aesthetic.
- **Features**:
  - Fast Payment Recording (Resident / Donor)
  - Quick Amount Presets (`₹1000`, `₹2100`, `₹2500`, `₹5000`, `₹11000`)
  - Automatic GPS Coordinate & Timestamp Capture
  - Instant WhatsApp Digital Receipt Sharing
  - Self-Registration & Password Reset

---

## 🚀 Getting Started

### 1. Run the Backend API
```bash
cd PujaCollectionTrackerAPI/src/PujaCollectionTracker.Web
dotnet run
```
API runs on `https://localhost:7123` (or `http://localhost:5000`).

### 2. Run the Web Portal
```bash
cd SGDPSWebsite
npm install
npm run dev
```
Portal runs on `http://localhost:5173`.

### 3. Run the Mobile App
```bash
cd SGDPSMobile
flutter pub get
flutter run
```

# 🎯 Habit Tracker

A full-stack habit tracking application with **Firebase Authentication**, **Firestore Database**, multi-timeframe goal setting, and a detailed monthly habit tracker.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20&%20Firestore-orange?style=flat-square&logo=firebase)

## ✨ Features

- **Multi-Timeframe Goals**: Set and track goals from 10-year visions to weekly tasks
- **Monthly Habit Tracker**: Interactive grid to track daily habits with completion percentages
- **Google Authentication**: Secure sign-in with Firebase Auth (Popup)
- **Real-time Sync**: Data instantly synced to Firestore
- **Offline Support**: Local caching for seamless experience
- **Beautiful Dark UI**: Modern glassmorphism design with smooth animations

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- A Google Firebase Project

### 1. Install Dependencies

```bash
cd d:\antigravity_projects\tracker
npm install
```

### 2. Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Authentication** and turn on the **Google** provider
4. Enable **Cloud Firestore** and start in **Test Mode** (or Production Mode)
5. Go to **Project Settings** > **General** > **Your apps** > **Web (</>)**
6. Copy the configuration object

### 3. Configure Environment Variables

Create `.env.local`:

```bash
touch .env.local
```

Add your Firebase keys:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
tracker/
├── app/
│   ├── dashboard/
│   │   ├── layout.tsx           # Dashboard layout
│   │   └── page.tsx             # Main dashboard (Firestore logic)
│   ├── login/
│   │   └── page.tsx             # Firebase Login page
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Landing page
├── components/
│   ├── AuthProvider.tsx         # Firebase Auth Context
│   ├── GoalCard.tsx             # Individual goal card
│   ├── GoalGrid.tsx             # Grid of all goals
│   ├── HabitTracker.tsx         # Monthly habit grid
│   ├── Header.tsx               # Navigation header
│   └── Providers.tsx            # Root providers wrapper
├── lib/
│   ├── firebase.ts              # Firebase initialization
│   └── localStorage.ts          # Cache utilities
└── package.json
```

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Authentication**: Firebase Auth (Google)
- **Database**: Firebase Cloud Firestore
- **Styling**: CSS Modules
- **Deployment**: Vercel

## 📝 License

MIT

# 🎯 Habit Tracker & Life Organizer

A comprehensive, modern web application designed to help you organize your life, track habits, and achieve your goals. Built with Next.js 14 and Firebase.

> **🌟 Live:** [Everform](everform.vercel.app & everform.celron.in)

## ✨ Features

- **📊 Dashboard & Goals**
  - **Goal Tracking**: Set and monitor Long Term and Short Term goals.
  - **Visual Statistics**: Track your habit streaks and completion rates.

- **✅ Advanced Todo Management**
  - **Three Timelines**: Manage tasks by **Today**, **This Week**, and **This Month**.
  - **Drag & Drop**: Seamlessly move tasks between lists and calendar dates.
  - **Bulk Actions**: Delete all, delete completed, and move pending tasks to the next period.
  - **Smart Organization**: Automatically organizes tasks based on your focus.

- **📓 Journal & Reflection**
  - **Daily Logging**: Keep track of your thoughts and progress.
  - **Calendar View**: Visual overview of your journal entries and productivity.

- **👤 User Profile**
  - **Personalized Experience**: Manage your profile details (Occupation, Age, etc.).
  - **Secure Authentication**: Powered by Firebase Auth.

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Authentication**: [Firebase Auth](https://firebase.google.com/products/auth)
- **Database**: [Firebase Cloud Firestore](https://firebase.google.com/products/firestore) (implied)
- **Styling**: CSS Modules
- **Drag & Drop**: [@dnd-kit](https://dndkit.com/)

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Firebase project

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/paarth-juneja/habit-tracker.git
    cd habit-tracker
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Configure Environment Variables**
    Create a `.env.local` file in the root directory and add your Firebase configuration:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    # or
    yarn dev
    ```

5.  **Open the app**
    Visit [http://localhost:3000](http://localhost:3000) in your browser.

## 📂 Project Structure

```bash
tracker/
├── app/                  # Next.js App Router pages
│   ├── dashboard/        # Dashboard page
│   ├── journal/          # Journaling features
│   ├── todo/             # Todo list & Drag-n-Drop logic
│   ├── login/            # Authentication
│   └── profile/          # User profile
├── components/           # Reusable UI components
│   ├── Journal/          # Calendar & Month selectors
│   ├── Todo/             # TodoList, Items
│   └── ...
├── lib/                  # Utilities & Firebase config
└── ...
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

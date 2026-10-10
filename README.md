# ✨ Thinksy

> **A modern, minimalist social platform for genuine thoughts, short-form reels, real-time community chat, and AI-powered creative inspiration.**

---

## 🌟 Overview

**Thinksy** is a responsive web application designed for sharing raw, unfiltered thoughts, late-night reflections, and creative confessions. Built with **Next.js 14**, **React 18**, **Tailwind CSS**, and **Firebase (Auth & Firestore)**, Thinksy pairs social interaction with an immersive UI, tactile Web Audio feedback, short-form Thought Reels, an AI Muse assistant, and real-time community chat with voice notes.

---

## 🚀 Key Features

### 💭 1. Thought Streams & Feeds
- **Rich Categories**: Explore thoughts across categories like *Late Night*, *Relatable*, *Deep*, *Work & Hustle*, *College Life*, and *Confessions*.
- **Interactive Reactions**: Like, bookmark, and engage with community thoughts.
- **Thought Creation**: Drop thoughts anonymously or with your creator handle, customized with background vibes and tags.

### 📱 2. Thinksy Reels
- **Vertical Short-Form Experience**: Fullscreen immersive reels designed for mobile and desktop.
- **Audio & Animations**: Smooth Framer Motion gesture-based transitions and audio ambiance.

### 💬 3. Real-Time Community Room
- **Live Public Chat**: Real-time group discussions synced via Firebase Firestore.
- **Voice Notes**: Record, preview, and send voice audio messages directly in the chat with built-in waveform player.
- **1-on-1 Direct Messaging**: Private conversations between creators.
- **Live Presence**: Online/offline indicators powered by Firestore presence tracking.
- **Safety & Moderation**: Built-in user blocking and report mechanisms.

### 🤖 4. AI Muse
- **Creative Thought Copilot**: Integrated AI assistant to help spark ideas, craft poetry, brainstorm reflections, and overcome writer's block.

### 🔐 5. Flexible Authentication & Verification
- **Email OTP Verification**: Automated 6-digit OTP delivery powered by Google SMTP / Nodemailer.
- **Firebase Auth**: Secure Google Sign-In and email credentials.
- **Quick Switcher**: Support for local creator profiles and multi-account switching.

### 🎨 6. Polished UI & Micro-Interactions
- **Glassmorphism & Themes**: Seamless Dark Mode and Light Mode support.
- **Web Audio FX**: Custom synthetic audio clicks, pops, and chimes for tactile feedback (with mute toggle).
- **Responsive Design**: Designed mobile-first for iPhones, Android devices, tablets, and desktop displays.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Frontend**: [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Backend & Database**: [Firebase Authentication](https://firebase.google.com/docs/auth) & [Cloud Firestore](https://firebase.google.com/docs/firestore)
- **Email Service**: [Nodemailer](https://nodemailer.com/) (Google SMTP)
- **Effects**: [canvas-confetti](https://www.npmjs.com/package/canvas-confetti), Web Audio API

---

## 📁 Project Structure

```text
client/
├── public/                 # Static assets, logos, and icons
├── src/
│   ├── app/                # Next.js App Router pages and API routes
│   │   ├── api/
│   │   │   ├── ai/chat/    # AI Muse streaming endpoint
│   │   │   ├── send-otp/   # Email OTP generation & delivery
│   │   │   ├── verify-email/ # Account email verification
│   │   │   └── verify-otp/ # OTP validation endpoint
│   │   ├── globals.css     # Tailwind and global styling
│   │   ├── layout.tsx      # Root application layout
│   │   └── page.tsx        # Main homepage feed and interaction hub
│   ├── components/         # Modular React components
│   │   ├── AuthModal.tsx       # Auth and verification modals
│   │   ├── CommunityModal.tsx  # Live chat room, voice notes, & members
│   │   ├── ReelsModal.tsx      # Immersive full-screen reels
│   │   ├── AIMuseModal.tsx     # AI assistant dialogue modal
│   │   ├── VoiceNotePlayer.tsx # Custom audio player component
│   │   └── ...
│   ├── lib/                # Shared utilities, Auth provider, & Firebase config
│   │   ├── auth.tsx        # Authentication context & account switching
│   │   ├── firebase.ts     # Firebase client initialization
│   │   ├── sound.ts        # Synthetic Web Audio effects engine
│   │   └── theme.tsx       # Theme provider (Light / Dark)
│   └── services/           # Service layer for Firestore and LocalStorage
│       ├── communityService.ts # Chat messages, presence, and moderation
│       ├── thoughtService.ts   # Thoughts CRUD and categorization
│       └── otpService.ts       # OTP delivery helpers
├── .env.example            # Environment variable template
├── firestore.rules         # Cloud Firestore security rules
├── package.json            # Dependencies and scripts
└── tailwind.config.ts      # Tailwind CSS configuration
```

---

## ⚙️ Getting Started

### 1. Prerequisites
- **Node.js** (v18.17.0 or higher recommended)
- **npm** or **yarn** / **pnpm**
- A **Firebase Project** ([Firebase Console](https://console.firebase.google.com/))
- A Gmail account with an **App Password** for SMTP OTP delivery

---

### 2. Installation

Clone this repository and install dependencies:

```bash
git clone https://github.com/YOUR_USERNAME/thinksy.git
cd thinksy
npm install
```

---

### 3. Environment Variables Configuration

Create a `.env.local` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env.local
```

Fill in the required configuration keys:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Google SMTP Credentials (for OTP emails)
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_google_app_password
EMAIL_FROM="Thinksy Team" <your_email@gmail.com>

# Optional Gemini API (for AI Muse)
GEMINI_API_KEY=your_gemini_api_key
```

> **Note**: For Google SMTP, use an **App Password** generated from [Google Account Security](https://myaccount.google.com/apppasswords), not your regular email password.

---

### 4. Firestore Security Rules

Deploy the included `firestore.rules` or paste them into your Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // Test mode / open rules
    }
  }
}
```

---

### 5. Running the Application

Start the local development server:

```bash
npm run dev
```

Open [http://localhost:3005](http://localhost:3005) (or [http://localhost:3000](http://localhost:3000)) in your browser.

---

### 6. Building for Production

To create an optimized production build:

```bash
npm run build
npm run start
```

---

## 🚢 Publishing to GitHub

To push this codebase to a new GitHub repository:

```bash
# 1. Initialize git
git init

# 2. Add all project files (sensitive .env.local is already in .gitignore)
git add .

# 3. Create initial commit
git commit -m "feat: initial commit for Thinksy web application"

# 4. Link your GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git

# 5. Push to main branch
git branch -M main
git push -u origin main
```

---

## 🔒 Security & Privacy

- All sensitive credentials (`.env*.local`, `.otp-cache.json`) are pre-configured in [`.gitignore`](.gitignore) to prevent accidental credential leakage.
- Direct message and voice note storage includes local data scoping and client-side encryption support.
- Built-in user reporting and blocking mechanism for content safety.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

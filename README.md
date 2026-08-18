# Calendar App

A modern, responsive calendar application built with **Next.js, React, TypeScript, and Tailwind CSS**. It provides a clean interface for organizing events, managing schedules, and viewing your calendar across different time periods.

## ✨ Features

* 📅 **Multiple Calendar Views**

  * Day
  * Week
  * Month
  * Year

* 📝 **Event Management**

  * Create and edit events
  * Organize events by calendar
  * Search through events
  * Store events locally in the browser

* 🎨 **Customizable Experience**

  * Light, dark, and system themes
  * Calendar visibility controls
  * Customizable calendar settings
  * Responsive design for desktop and mobile

* 🌤️ **Optional Live Weather**

  * Uses your browser's location permission
  * Displays current weather conditions and temperature
  * Powered by Open-Meteo
  * Location access is only requested when the live-weather feature is enabled

* 🔎 **Quick Search**

  * Quickly find events and scheduled activities

* 📱 **Responsive Interface**

  * Designed to work across desktop, tablet, and mobile screen sizes

## 🛠️ Tech Stack

* **Next.js 15**
* **React 19**
* **TypeScript**
* **Tailwind CSS**
* **date-fns**
* **Lucide React**
* **Radix UI**
* **next-themes**
* **Sonner**
* **Open-Meteo API**

## 🚀 Getting Started

### Prerequisites

Make sure you have installed:

* [Node.js](https://nodejs.org/)
* npm, pnpm, or another compatible package manager

### Installation

Clone the repository:

```bash
git clone <YOUR_REPOSITORY_URL>
cd CalendarApp-main
```

Install the dependencies:

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

The application should now be available locally.

## 📦 Production Build

To create a production build:

```bash
npm run build
```

Start the production server with:

```bash
npm start
```

## 🔐 Privacy & Security

This application is designed to keep personal calendar data on the user's device.

### Local Data

Calendar events, settings, and calendar visibility preferences are stored using the browser's **localStorage**.

The application does not require a database or account system for its core calendar functionality.

### Location Data

Live weather is an optional feature.

If enabled, the application requests permission to access the device's approximate location through the browser's Geolocation API. The coordinates are then used to request weather information from Open-Meteo.

Location access is:

* Optional
* Controlled by the browser's permission system
* Only requested when live weather is enabled
* Not stored as a calendar event or user profile

### API Keys

The application does not require private API keys for its current weather functionality.

Do not commit API keys, passwords, tokens, or other secrets to the repository if additional services are added in the future.

Environment files such as `.env` are excluded through `.gitignore`.

## 📁 Project Structure

```text
CalendarApp-main/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── loading.tsx
│   └── page.tsx
│
├── components/
│   ├── calendar/
│   │   ├── calendar-views.tsx
│   │   ├── event-dialog.tsx
│   │   ├── profile-menu.tsx
│   │   ├── settings-dialog.tsx
│   │   ├── sidebar.tsx
│   │   └── weather-overlay.tsx
│   │
│   ├── ui/
│   └── theme-provider.tsx
│
├── hooks/
│   ├── use-geolocation.ts
│   ├── use-mobile.ts
│   └── use-toast.ts
│
├── lib/
│   ├── calendar.ts
│   ├── scenes.ts
│   ├── utils.ts
│   └── weather.ts
│
├── public/
├── package.json
├── next.config.mjs
├── tailwind.config.*
└── README.md
```

## 🧪 Available Scripts

| Command         | Description                  |
| --------------- | ---------------------------- |
| `npm run dev`   | Start the development server |
| `npm run build` | Create a production build    |
| `npm start`     | Start the production server  |
| `npm run lint`  | Run ESLint                   |

## ⚠️ Current Limitations

This application currently uses browser-based local storage rather than a backend database.

This means:

* Calendar data is tied to the browser/device where it was created.
* Data is not automatically synchronized between devices.
* Clearing browser storage can remove locally stored calendar data.
* There is currently no user authentication or cloud synchronization.

These limitations may be addressed in future versions.

## 🔮 Future Improvements

Potential improvements include:

* User authentication
* Cloud synchronization
* Database-backed events
* Calendar import/export
* Google Calendar integration
* Event reminders and notifications
* Recurring events
* Drag-and-drop event management
* Improved accessibility
* Offline/PWA support

## 📄 License

This project does not currently specify a license.

If you intend to allow others to use, modify, or redistribute the project, consider adding an appropriate open-source license such as MIT.

## 👤 Author

Developed as a personal project to explore modern web development, calendar interfaces, client-side data management, and cloud-ready application architecture.

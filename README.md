📱 Record Keeper App

A mobile app built with **React Native (Expo)** for shopkeepers to record and manage product sales and payments efficiently. This app uses **Firebase Firestore** as the backend to persist data securely across sessions.

---

🚀 Features

- 📦 **Shop & Product Management**
  - Add, delete, and view shops
  - Add, delete, and view products under each shop

- 📊 **Sales Entry & History**
  - Enter sales by selecting a date, rate, and quantity
  - Sales data is saved in a table format with total calculation (Rate × Quantity)
  - View historical sales in an Excel-like format

- ✏️ **Edit & Delete Sales**
  - Easily update or remove existing sales
  - Editing a sale also updates the total earnings accordingly

- 💰 **Payments Screen**
  - Shows total earnings for a shop
  - Add received payments, which subtract from the total
  - View all past payments with dates

- 🔄 **Realtime Firebase Integration**
  - All data is synced with Firebase Firestore
  - Data persists even after app restarts

- ✅ **Optimized FlatList for performance**
  - Smooth scrolling with animated entry
  - Pagination supported with `onEndReached`

---

🛠️ Tech Stack

- **React Native** with **Expo CLI**
- **Firebase Firestore** for backend database
- **React Navigation (Expo Router)**
- **React Native Animatable / Reanimated** for UI animations
- **FlatList Optimization Techniques**

---

📂 Folder Structure
RecordKeeperApp/ ├── app/ │ ├── index.tsx # Landing screen │ ├── _layout.tsx # Stack navigation │ ├── shops/ # Shops screen │ ├── products/ # Product management │ ├── product-details/ # Sales detail entry and view │ └── payments/ # Payments screen ├── firebase.js # Firebase config & initialization ├── assets/ # App images and icons └── README.md

🧪 Setup Instructions

1. **Clone the repo:**
   git clone https://github.com/yourusername/record-keeper-app.git
   cd record-keeper-app
2. **Install dependencies:**
   npm install
3. **Run the app:**
   npx expo start
✨ Future Improvements

-> Export sales data as CSV

-> Improved UI/UX with dark mode

-> Use FlashList for even better performance

🧑‍💻 Developed By
Hassan
MERN + React Native Developer
📬 http://hassan-arslan.vercel.app

📱 RecordTrack - Business Management App

A comprehensive mobile app built with **React Native (Expo)** for shopkeepers and small business owners to efficiently manage products, sales, and payments. This app uses **Firebase Firestore** as the backend to persist data securely across sessions with real-time synchronization.

---

🚀 Key Features

## 🔐 **User Authentication & Security**

- Secure email/password registration and login
- Email verification for account activation
- Password reset functionality via email
- Change password with current password verification
- User profile management with first name and last name
- Secure logout with credential cleanup

## 📦 **Shop & Product Management**

- Create, edit, and delete multiple shops
- Real-time shop data synchronization across devices
- Add, edit, and delete products for each shop
- Set product names and rates
- Individual product management with validation
- User-specific shop access control

## 📊 **Advanced Sales Management**

- **Excel-like Sales Entry**: Enter sales data in a table format with date, quantities for multiple products
- **Bulk Sales Recording**: Record sales for multiple products simultaneously
- **Consolidated Sales View**: View all sales in a comprehensive table format
- **Sales Analytics**: Calculate totals automatically (Rate × Quantity)
- **Historical Sales Data**: Browse sales history sorted by date
- **Sales Editing & Deletion**: Modify or remove existing sales entries with validation

## 💰 **Comprehensive Payment System**

- **Total Earnings Tracking**: Automatic calculation of total shop earnings
- **Payment Recording**: Record payments received from customers
- **Expense Management**: Track business expenses for each payment
- **Due Amount Calculation**: Smart calculation (Received + Expenses - Sale Total)
- **Payment History**: View complete payment records with dates
- **Edit & Delete Payments**: Modify payment records with financial integrity
- **Payment Status Tracking**: Visual indicators for paid/unpaid sales

## 🔄 **Real-time Data Synchronization**

- **Firebase Firestore Integration**: All data synced in real-time with optimized queries
- **Efficient Pagination**: Smart data loading with 10-item batches for better performance
- **Multi-device Support**: Access your data from any device instantly
- **Offline-first Design**: Continue working even without internet
- **Automatic Backup**: Data automatically backed up to cloud
- **Data Persistence**: Information remains safe across app restarts
- **Duplicate Prevention**: Advanced filtering prevents duplicate entries
- **Index Optimization**: Queries optimized to avoid Firebase index requirements

## 🎨 **Modern User Experience**

- **Smooth Animations**: React Native Reanimated for fluid interactions
- **Responsive Design**: Optimized for all screen sizes
- **Material Design Icons**: Intuitive iconography throughout the app
- **Loading States**: Clear feedback during data operations
- **Error Handling**: Comprehensive error messages and validation
- **Pull-to-Refresh**: Easy data refresh with swipe gestures

---

🛠️ Tech Stack & Architecture

**Frontend:**

- **React Native** with **Expo CLI** (v~52.0.39)
- **Expo Router** for file-based navigation and routing
- **React Native Reanimated v3** for smooth animations and transitions
- **React Native Paper** for Material Design components
- **React Native Vector Icons** & **Expo Vector Icons** for iconography
- **React Native Modal DateTime Picker** for date selection

**Backend & Database:**

- **Firebase Firestore** for real-time NoSQL database with optimized queries
- **Firebase Authentication** for secure user management
- **Firebase Cloud Storage** for user data synchronization
- **Hierarchical Data Structure**: shops/{shopId}/products, shops/{shopId}/sales, shops/{shopId}/payments
- **Efficient Pagination**: 10-item batch loading for optimal performance
- **Local Filtering**: Client-side filtering to avoid complex Firebase indexes

**Development & Performance:**

- **AsyncStorage** for local data persistence
- **React Native Gesture Handler** for smooth touch interactions
- **React Native Safe Area Context** for device-safe layouts
- **Optimized FlatLists** with smart pagination and smooth scrolling
- **Memoized Components** for performance optimization
- **Real-time Listeners** for instant data updates
- **Duplicate Prevention System**: Triple-layer filtering to prevent duplicate entries
- **Efficient Data Loading**: Pagination with 10-item batches for faster loading
- **Local Filtering**: Client-side user filtering to avoid Firebase index requirements
- **Memory Optimization**: Set-based duplicate detection for efficient processing

---

📂 Project Structure

```
RecordTrack/
├── app/                          # Main application screens
│   ├── index.jsx                 # Welcome/Landing screen with auth check
│   ├── login.jsx                 # User authentication (sign in)
│   ├── signup.jsx                # User registration with email verification
│   ├── forgetpassword.jsx        # Password reset functionality
│   ├── changepassword.jsx        # Change password with verification
│   ├── shops.jsx                 # Shop management (CRUD operations)
│   ├── products.jsx              # Individual product management
│   ├── productAndDetail.jsx      # Advanced product & sales management
│   ├── sales.jsx                 # Sales data entry and history
│   ├── payments.jsx              # Payment tracking and management
│   └── components/
│       └── head.jsx              # Header component with user menu
├── assets/                       # App images, icons, and resources
│   ├── icon.png                  # App icon
│   ├── splash-icon.png           # Splash screen icon
│   ├── pen.png                   # Branding assets
│   ├── paperpen.png              # Background images
│   └── Deer.jpg                  # Login/signup backgrounds
├── firebase.config.js            # Firebase configuration and initialization
├── app.json                      # Expo app configuration
├── package.json                  # Dependencies and scripts
└── README.md                     # Project documentation
```

---

🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Expo CLI (`npm install -g @expo/cli`)
- Android Studio (for Android development) or Xcode (for iOS development)
- Firebase project with Firestore and Authentication enabled

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Hassan89221/RecordTrack.git
   cd RecordTrack
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure Firebase:**

   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication and Firestore Database
   - Update `firebase.config.js` with your Firebase configuration

4. **Start the development server:**

   ```bash
   npx expo start
   ```

5. **Run on your device:**
   - Scan the QR code with Expo Go app (Android/iOS)
   - Or press `a` for Android emulator, `i` for iOS simulator

---

🎯 Usage Guide

### Setting Up Your Business

1. **Register** with your email and verify your account
2. **Create shops** for your different business locations
3. **Add products** with names and rates for each shop
4. **Record sales** using the table-based entry system
5. **Manage payments** to track earnings and expenses

### Recording Sales

- Navigate to any shop to access the **Products & Details** screen
- Use the **Add Sales** button to record new sales
- Enter quantities for multiple products simultaneously
- Sales are automatically calculated and saved

### Managing Payments

- Access the **Payments** screen from any shop
- View total earnings and outstanding amounts
- Record payments received from customers
- Track expenses and calculate due amounts
- Edit or delete payment records as needed

---

✨ Advanced Features

- **Multi-shop Support**: Manage multiple business locations
- **Bulk Operations**: Record sales for multiple products at once
- **Financial Analytics**: Automatic calculation of totals, dues, and earnings
- **Data Export Ready**: Structured data ready for CSV export (future feature)
- **Responsive Design**: Works seamlessly on phones and tablets
- **Real-time Sync**: Changes appear instantly across all devices with optimized performance
- **Secure Authentication**: Industry-standard security practices
- **Smart Pagination**: Efficient data loading with 10-item batches
- **Duplicate Prevention**: Advanced filtering system prevents duplicate entries
- **Firebase Optimization**: Queries optimized to avoid complex index requirements
- **Memory Efficient**: Smart duplicate detection using Set data structures

---

🔮 Roadmap & Future Enhancements

- 📊 **Advanced Analytics Dashboard** with charts and insights
- 📤 **Export to CSV/Excel** for external analysis
- 🌙 **Dark Mode** for better user experience
- 📱 **FlashList Integration** for even better performance
- 🔔 **Push Notifications** for payment reminders
- 📈 **Sales Forecasting** using historical data
- 🏪 **Multi-currency Support** for international businesses
- 👥 **Team Management** with role-based access
- ⚡ **Advanced Caching** for offline functionality
- 🔍 **Search & Filter** capabilities across all data
- 📊 **Real-time Dashboard** with live business metrics

---

🧑‍💻 Developer

**Hassan Arslan Amir**  
MERN Stack + React Native Developer  
🌐 Portfolio: [hassan-arslan.vercel.app](https://hassan-arslan.vercel.app)  
� Contact: [Your Email]  
🔗 GitHub: [@Hassan89221](https://github.com/Hassan89221)

---

📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Hassan89221/RecordTrack/issues).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

⭐ Show Your Support

If this project helped you, please give it a ⭐ on GitHub and share it with others!

---

📱 Screenshots

_Coming soon - Screenshots of the app in action_

---

🙏 Acknowledgments

- [Expo](https://expo.dev/) for the amazing development platform
- [Firebase](https://firebase.google.com/) for backend services
- [React Native](https://reactnative.dev/) community for excellent documentation
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) for smooth animations

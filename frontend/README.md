# TOKENPAPSYSTEM Frontend

A modern, high-performance React-based admin and customer dashboard for the TOKENPAPSYSTEM. Built with Vite, Tailwind CSS, and Framer Motion for a premium user experience.

---

## 🌟 Key Features

### 📊 Comprehensive Dashboards
- **Role-Based Access**: Specialized interfaces for Admins, Vendors, and Customers.
- **Real-time Analytics**: Interactive charts and data visualization using Recharts.
- **Vending Control**: Centralized management for meter assignments and token generation.

### ♿ Accessibility First
- **Advanced Accessibility Menu**: Integrated tools for high-contrast, text scaling, and readable font adjustments.
- **Responsive Design**: Fully optimized for desktop, tablet, and mobile devices.

### 💳 Payment & Vending
- **M-Pesa Integration**: Seamless STK Push payment flow for customers.
- **Purchase History**: Detailed logs of all transactions and generated tokens.
- **PIN-based Fields**: Secure input fields for OTP and sensitive data entry.

### 📥 Data Management & Export
- **Multi-Format Export**: Generate professional reports in PDF, Excel, and CSV formats.
- **QR Code Integration**: Instant generation of QR codes for meter identification.
- **Dropzone File Uplads**: Intuitive drag-and-drop for logo and profile image uploads.

---

## 🛠 Technology Stack

- **Core**: React 18, Vite 5, TypeScript
- **Styling**: Tailwind CSS, Framer Motion (Animations), Radix UI (Primitives)
- **State & Data**: Context API, Axios (REST), Socket.io (Real-time)
- **Visualization**: Recharts, Lucide React (Icons)
- **Forms**: React Hook Form, Pin Field
- **Feedback**: SweetAlert2, React Hot Toast, React Toastify
- **Utilities**: Dayjs, Papaparse (CSV), XLSX (Excel), JSPDF (PDF)

---

## ⚙️ Setup Instructions

### 1. Requirements
- Node.js (v18 or higher)
- npm or yarn

### 2. Installation
```bash
# Navigate to the frontend directory
npm install
```

### 3. Configuration
Create a `.env` file in the root of the frontend directory:
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GA_MEASUREMENT_ID=your_google_analytics_id
```

### 4. Running the Development Server
```bash
npm run dev
```

### 5. Building for Production
```bash
npm run build
```

---

## 📁 Project Structure

- `src/components`: Reusable UI components (Layout, UI primitives, etc.)
- `src/pages`: Main application views (Admin, Vendor, Customer portals)
- `src/context`: React Contexts for state management (Auth, Accessibility)
- `src/hooks`: Custom React hooks for API and UI logic
- `src/data`: Static data and configuration
- `src/assets`: Images, icons, and global styles

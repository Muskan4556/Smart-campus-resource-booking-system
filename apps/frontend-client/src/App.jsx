import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import Signup from "./pages/signup";
import Dashboard from "./pages/Dashboard";
import BookingPage from "./pages/BookingPage";
import LandingPage from "./pages/LandingPage";
import AdminPage from "./pages/AdminPage";
import ResourceBookingsPage from "./pages/ResourceBookingsPage";
import ProtectedRoute, { AdminRoute } from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/booking" element={
          <ProtectedRoute><BookingPage /></ProtectedRoute>
        } />

        {/* Admin only */}
        <Route path="/admin" element={
          <AdminRoute><AdminPage /></AdminRoute>
        } />
        <Route path="/admin/resources/:resourceId/bookings" element={
          <AdminRoute><ResourceBookingsPage /></AdminRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
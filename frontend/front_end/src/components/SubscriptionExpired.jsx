// components/SubscriptionExpired.jsx

import { useNavigate } from "react-router-dom";

export default function SubscriptionExpired() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-xl p-8 max-w-md text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">
          Subscription Expired
        </h1>

        <p className="text-gray-600 mb-6">
          Your school's subscription has ended. Please contact the administrator
          to renew the subscription.
        </p>

        <button
          onClick={() => navigate("/")}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}

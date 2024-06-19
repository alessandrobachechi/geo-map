import React from "react";
import { useAuth } from "../hooks/useAuth";

const Logout = () => {
  const { logout } = useAuth();

  const handleLogout = async (event) => {
    event.stopPropagation(); // Prevent click event from propagating to the map
    try {
      await logout();
      console.log("User logged out successfully");
    } catch (error) {
      console.error("Logout error:", error.message);
    }
  };

  return (
    <button className="logout-button" onClick={handleLogout}>
      Logout
    </button>
  );
};

export default Logout;

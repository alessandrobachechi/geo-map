import React, { useState, useEffect } from "react";
import { Outlet, useLocation, Link, useNavigate } from "react-router-dom";
import "../Layout.css";

const Layout = () => {
  const [isFullScreen, setIsFullScreen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === "/") {
      navigate("/register");
    } else if (
      location.pathname === "/login" ||
      location.pathname === "/register"
    ) {
      setIsFullScreen(false);
    } else {
      setIsFullScreen(true);
    }
  }, [location.pathname, navigate]);

  return (
    <div>
      <nav className="nav-bar">
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
      </nav>
      <div
        className={`layout-container ${
          isFullScreen ? "full-screen" : "reduced-screen"
        }`}
      >
        <div className="layout-left">
          <h1>Geo Map</h1>
          <p>
            Benvenuti su Geo Map! Qui potrete creare la vostra mappa
            personalizzata <span>con i vostri luoghi preferiti.</span>
          </p>
        </div>
        <div className="layout-right">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;

import React, { useEffect } from "react";
import Navigation from "./components/Navigation";
import "./styles/global.css";
import authService from "./services/authService";
import socketService from "./services/socketService";

const App: React.FC = () => {
  useEffect(() => {
    // This effect runs once when the app component mounts
    const token = authService.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const userId = payload.user_id;

        if (userId) {
          // Connect to the socket server if user is logged in
          socketService.connect(userId, token);
        }
      } catch (e) {
        console.error("Failed to decode token for socket connection:", e);
      }
    }

    // The cleanup function will be called when the App component unmounts
    return () => {
      socketService.disconnect();
    };
  }, []); // The empty dependency array ensures this effect runs only once

  return (
    <div className="app-container">
      <Navigation />
    </div>
  );
};

export default App;

import React from "react";
import Navigation from "./components/Navigation";
import "./styles/global.css";

const App: React.FC = () => {
  return (
    <div className="app-container">
      <Navigation />
    </div>
  );
};

export default App;

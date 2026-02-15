import React, { useState, useEffect } from "react";
import PTOFormDesktop from "./PTOFormDesktop";
import PTOFormMobile from "./PTOFormMobile";

function PTOForm({ user, onBack, onNavigate, tasklistTodoCount = 0 }) {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 768 : false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (isMobile) {
    return <PTOFormMobile user={user} onBack={onBack} onNavigate={onNavigate} tasklistTodoCount={tasklistTodoCount} />;
  }

  return <PTOFormDesktop user={user} onBack={onBack} />;
}

export default PTOForm;

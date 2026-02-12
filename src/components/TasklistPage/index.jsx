import React, { useState, useEffect } from "react";
import TasklistPageDesktop from "./TasklistPageDesktop";
import TasklistPageMobile from "./TasklistPageMobile";

function TasklistPage({ user, onBack, onNavigate }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile ? (
    <TasklistPageMobile user={user} onBack={onBack} onNavigate={onNavigate} />
  ) : (
    <TasklistPageDesktop user={user} />
  );
}

export default TasklistPage;

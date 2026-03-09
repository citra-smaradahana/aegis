import React, { useState, useEffect } from "react";
import HomeDesktop from "./HomeDesktop";
import HomeMobile from "./HomeMobile";

function Home({ user, onNavigate, validationCount = 0, ftwNeedsFill = false, tasklistTodoCount = 0 }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile ? (
    <HomeMobile user={user} onNavigate={onNavigate} validationCount={validationCount} ftwNeedsFill={ftwNeedsFill} tasklistTodoCount={tasklistTodoCount} />
  ) : (
    <HomeDesktop user={user} />
  );
}

export default Home;

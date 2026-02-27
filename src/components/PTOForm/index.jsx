import React, { useState, useEffect } from "react";
import PTOFormDesktop from "./PTOFormDesktop";
import PTOFormMobile from "./PTOFormMobile";
import PTORiwayatMobile from "./PTORiwayatMobile";

function PTOForm({ user, onBack, onNavigate, tasklistTodoCount = 0 }) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 768 : false,
  );
  const [mobileMode, setMobileMode] = useState("input");

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (isMobile)
    return (
      <div style={{ width: "100%" }}>
        {mobileMode === "input" ? (
          <PTOFormMobile
            user={user}
            onBack={onBack}
            onNavigate={onNavigate}
            tasklistTodoCount={tasklistTodoCount}
            onSwitchToHistory={() => setMobileMode("history")}
          />
        ) : (
          <PTORiwayatMobile
            user={user}
            onBack={onBack}
            onNavigate={onNavigate}
            tasklistTodoCount={tasklistTodoCount}
            onSwitchToInput={() => setMobileMode("input")}
          />
        )}
      </div>
    );

  return <PTOFormDesktop user={user} onBack={onBack} />;
}

export default PTOForm;

import React, { useState, useEffect } from "react";
import PTOFormDesktop from "./PTOFormDesktop";
import PTOFormMobile from "./PTOFormMobile";

function PTOForm({ user, onBack }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (isMobile) {
    return <PTOFormMobile user={user} onBack={onBack} />;
  }

  return <PTOFormDesktop user={user} onBack={onBack} />;
}

export default PTOForm;

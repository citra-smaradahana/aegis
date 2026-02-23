import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import MobileBottomNavigation from "./MobileBottomNavigation";
import { fetchAllowedMenusForUser } from "../utils/menuAccessHelpers";

const urlRegex = /(https?:\/\/[^\s]+)/g;
function parseTextWithLinks(text) {
  if (!text) return null;
  const parts = text.split(urlRegex);
  return parts.map((part, i) =>
    part.match(urlRegex) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "#60a5fa", textDecoration: "underline" }}
      >
        {part}
      </a>
    ) : (
      part
    )
  );
}

function getPreviewText(text, maxLength = 90) {
  if (!text) return "";
  const cleanText = text.replace(urlRegex, "").replace(/\s+/g, " ").trim();
  if (cleanText.length <= maxLength) return cleanText;
  return `${cleanText.slice(0, maxLength).trimEnd()}...`;
}

// Fallback: jabatan validator (jika tidak ada config di DB)
function canAccessFitToWorkValidationFallback(user) {
  if (!user) return false;
  if (user?.jabatan === "Administrator" || user?.jabatan === "Admin Site Project") return true;
  const jabatan = (user?.jabatan || "").trim();
  const validatorJabatan = [
    "Field Leading Hand",
    "Plant Leading Hand",
    "Asst. Penanggung Jawab Operasional",
    "Penanggung Jawab Operasional",
    "SHE",
    "SHERQ Officer",
  ];
  return validatorJabatan.includes(jabatan);
}

const REPORT_PTO_JABATAN = [
  "SHERQ Officer",
  "Field Leading Hand",
  "Plant Leading Hand",
  "Technical Service",
  "Asst. Penanggung Jawab Operasional",
  "Penanggung Jawab Operasional",
];

function canAccessReportFallback(user) {
  if (!user) return false;
  if (user?.jabatan === "Administrator" || user?.jabatan === "Admin Site Project") return true;
  return REPORT_PTO_JABATAN.includes((user?.jabatan || "").trim());
}

function canAccessPTOFallback(user) {
  if (!user) return false;
  if (user?.jabatan === "Administrator" || user?.jabatan === "Admin Site Project") return true;
  return REPORT_PTO_JABATAN.includes((user?.jabatan || "").trim());
}

function HomeMobile({ user, onNavigate, validationCount = 0, ftwNeedsFill = false, tasklistTodoCount = 0 }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [readMoreCampaign, setReadMoreCampaign] = useState(null);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [campaignIndex, setCampaignIndex] = useState(0);
  const [campaignPaused, setCampaignPaused] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 400
  );
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== "undefined" ? window.innerHeight : 800
  );
  const [failedCampaignImages, setFailedCampaignImages] = useState({});
  const [campaignImageRatios, setCampaignImageRatios] = useState({});
  const resumeCampaignTimerRef = useRef(null);

  const menuContentWidth = Math.max(220, viewportWidth - 54);
  const campaignCardWidth = Math.min(350, menuContentWidth);
  const compactViewport = viewportHeight < 760;
  const campaignImageHeight = Math.round(
    Math.min(
      compactViewport ? 128 : 170,
      Math.max(compactViewport ? 98 : 120, campaignCardWidth * (compactViewport ? 0.38 : 0.46))
    )
  );

  const getCampaignImageFit = (campaign) => {
    const ratio = campaignImageRatios[campaign?.id];
    if (!ratio) return "cover";
    return ratio < 1.2 ? "contain" : "cover";
  };

  const pauseCampaignTemporarily = (ms = 5000) => {
    setCampaignPaused(true);
    if (resumeCampaignTimerRef.current) clearTimeout(resumeCampaignTimerRef.current);
    resumeCampaignTimerRef.current = setTimeout(() => {
      setCampaignPaused(false);
    }, ms);
  };

  const goToNextCampaign = () => {
    if (campaigns.length <= 1) return;
    setCampaignIndex((prev) => (prev + 1) % campaigns.length);
    pauseCampaignTemporarily(5500);
  };

  const goToPrevCampaign = () => {
    if (campaigns.length <= 1) return;
    setCampaignIndex((prev) => (prev - 1 + campaigns.length) % campaigns.length);
    pauseCampaignTemporarily(5500);
  };

  useEffect(() => {
    // Fallback viewport height untuk device lama yang belum stabil mendukung dvh.
    const setLegacyViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--app-vh", `${vh}px`);
    };
    setLegacyViewportHeight();
    window.addEventListener("resize", setLegacyViewportHeight);
    window.addEventListener("orientationchange", setLegacyViewportHeight);
    return () => {
      window.removeEventListener("resize", setLegacyViewportHeight);
      window.removeEventListener("orientationchange", setLegacyViewportHeight);
    };
  }, []);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const { data, error } = await supabase
          .from("campaigns")
          .select("*")
          .order("created_at", { ascending: false });
        if (!error) setCampaigns(data || []);
      } catch (e) {
        console.error("Error fetching campaigns:", e);
      } finally {
        setLoadingCampaigns(false);
      }
    };
    fetchCampaigns();
  }, []);

  useEffect(() => {
    const onResize = () => {
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    if (campaigns.length <= 1 || campaignPaused) return;
    const intervalId = setInterval(() => {
      setCampaignIndex((prev) => (prev + 1) % campaigns.length);
    }, 11000);
    return () => {
      clearInterval(intervalId);
    };
  }, [campaigns.length, campaignPaused]);

  const [allowedMenus, setAllowedMenus] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) {
      setAllowedMenus(null);
      return;
    }
    fetchAllowedMenusForUser(user).then((menus) => {
      if (!cancelled) setAllowedMenus(menus);
    });
    return () => { cancelled = true; };
  }, [user?.id, user?.jabatan, user?.site]);

  useEffect(() => {
    return () => {
      if (resumeCampaignTimerRef.current) {
        clearTimeout(resumeCampaignTimerRef.current);
      }
    };
  }, []);

  const allMenuItems = [
    { key: "fit-to-work", label: "FTW", fullLabel: "Fit To Work", icon: "👷", color: "#3b82f6", placeholder: false },
    { key: "fit-to-work-validation", label: "Validasi", fullLabel: "Validasi Fit To Work", icon: "✅", color: "#10b981", placeholder: false },
    { key: "daily-attendance", label: "Laporan", fullLabel: "Laporan Kehadiran", icon: "📄", color: "#0ea5e9", placeholder: false },
    { key: "take-5", label: "Take 5", fullLabel: "Take 5", icon: "⏰", color: "#f59e0b", placeholder: false },
    { key: "hazard", label: "Hazard", fullLabel: "Hazard", icon: "⚠️", color: "#ef4444", placeholder: false },
    { key: "pto", label: "PTO", fullLabel: "Laporan PTO", icon: "📋", color: "#8b5cf6", placeholder: false },
    { key: "slot-7", label: "Segera", fullLabel: "Segera", icon: "➕", color: "#9ca3af", placeholder: true },
    { key: "slot-8", label: "Segera", fullLabel: "Segera", icon: "➕", color: "#9ca3af", placeholder: true },
  ];

  const hasReportAccess = allowedMenus
    ? allowedMenus.includes("daily-attendance")
    : canAccessReportFallback(user);
  const hasPTOAccess = allowedMenus ? allowedMenus.includes("pto") : canAccessPTOFallback(user);
  const hasValidasiAccess = allowedMenus
    ? allowedMenus.includes("fit-to-work-validation")
    : canAccessFitToWorkValidationFallback(user);
  const isRegularUser = !hasReportAccess && !hasPTOAccess && !hasValidasiAccess;

  const menuItemsRaw = (allowedMenus
    ? allMenuItems.filter((item) => !item.placeholder && allowedMenus.includes(item.key))
    : allMenuItems.filter((item) => {
        if (isRegularUser) return ["fit-to-work", "take-5", "hazard"].includes(item.key);
        if (item.key === "daily-attendance" && !hasReportAccess) return false;
        if (item.key === "pto" && !hasPTOAccess) return false;
        return true;
      })
  ).map((item) => {
    if (item.key === "fit-to-work-validation" && !hasValidasiAccess) {
      return { ...item, placeholder: true, label: "Segera" };
    }
    return item;
  });

  const menuItems =
    allowedMenus
      ? menuItemsRaw
      : isRegularUser
        ? menuItemsRaw
        : hasReportAccess
          ? menuItemsRaw
          : menuItemsRaw.slice(0, 6);

  const useListLayout = menuItems.length <= 5;

  return (
    <>
    <style>{`
      .mobile-campaign-scroll::-webkit-scrollbar { display: none; }
    `}</style>
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: "calc(var(--app-vh, 1vh) * 100)",
        background: "#f8fafc",
        overflowY: "auto",
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
        overscrollBehaviorY: "contain",
        display: "flex",
        flexDirection: "column",
        paddingBottom: "calc(70px + env(safe-area-inset-bottom))", // Space untuk bottom nav
        boxSizing: "border-box",
      }}
    >
      {/* Header dengan foto profil - fixed layout, tidak scroll */}
      <div
        className="mobile-home-header"
        style={{
          flexShrink: 0,
          background: "linear-gradient(135deg, #ea580c 0%, #dc2626 100%)",
          padding: "16px 20px",
          color: "white",
          boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
        }}
      >
        <div
          className="mobile-home-profile"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            maxWidth: 1200,
            margin: "0 auto",
            minHeight: 56,
          }}
        >
          {/* Foto Profil */}
          <div
            className="mobile-home-avatar"
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid rgba(255,255,255,0.3)",
              flexShrink: 0,
            }}
          >
            {(() => {
              const avatarUrl =
                user?.photo_url ||
                user?.avatar_url ||
                user?.foto_url ||
                user?.foto ||
                null;
              const initials = (user?.nama || user?.user || "?")
                .toString()
                .trim()
                .split(" ")
                .map((s) => s[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="avatar"
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: "white",
                  }}
                >
                  {initials}
                </div>
              );
            })()}
          </div>

          {/* Nama dan Jabatan - dibatasi lebar dan baris agar height konsisten */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                marginBottom: 2,
                lineHeight: 1.3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {user?.nama || user?.user || "Pengguna"}
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                opacity: 0.95,
                fontWeight: 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                lineHeight: 1.3,
              }}
            >
              {user?.jabatan || "Karyawan"}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                opacity: 0.85,
                marginTop: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Selamat datang di AEGIS KMB
            </p>
          </div>
        </div>
      </div>

      {/* Menu + Campaign - tanpa scroll vertikal */}
      <div
        className="mobile-home-menu"
        style={{
          flex: 1,
          minHeight: "min-content",
          overflow: "visible",
          padding: "8px 20px 8px",
          maxWidth: 1200,
          margin: "0 auto",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
        }}
      >
        <div
          className="mobile-home-menu-grid"
          style={{
            display: useListLayout ? "flex" : "grid",
            flexDirection: useListLayout ? "column" : undefined,
            gridTemplateColumns: useListLayout ? undefined : menuItems.length > 5 ? "repeat(4, 1fr)" : "repeat(3, 1fr)",
            gap: useListLayout ? 8 : 10,
            flexShrink: 0,
            paddingRight: 8,
            boxSizing: "border-box",
          }}
        >
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => !item.placeholder && onNavigate(item.key)}
              disabled={item.placeholder}
              className="mobile-home-menu-item"
              style={{
                background: item.placeholder ? "#f1f5f9" : "white",
                border: "none",
                borderRadius: 12,
                padding: useListLayout ? "12px 16px" : "10px 8px",
                cursor: item.placeholder ? "default" : "pointer",
                boxShadow: item.placeholder ? "none" : "0 4px 12px rgba(0,0,0,0.1)",
                transition: "all 0.2s ease",
                textAlign: useListLayout ? "left" : "center",
                display: "flex",
                flexDirection: useListLayout ? "row" : "column",
                alignItems: "center",
                gap: useListLayout ? 14 : 6,
                minHeight: useListLayout ? 56 : 72,
                opacity: item.placeholder ? 0.7 : 1,
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (!item.placeholder) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = item.placeholder ? "none" : "0 4px 12px rgba(0,0,0,0.1)";
              }}
            >
              <div
                className="mobile-home-menu-icon"
                style={{
                  width: useListLayout ? 40 : 36,
                  height: useListLayout ? 40 : 36,
                  borderRadius: "10px",
                  background: `${item.color}20`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: useListLayout ? 20 : 18,
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </div>
              <span
                style={{
                  fontSize: useListLayout ? 15 : 11,
                  fontWeight: 600,
                  color: item.placeholder ? "#94a3b8" : "#1f2937",
                  lineHeight: 1.2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  flex: useListLayout ? 1 : undefined,
                }}
              >
                {useListLayout && item.fullLabel && !item.placeholder ? item.fullLabel : item.label}
              </span>
              {item.key === "fit-to-work" && ftwNeedsFill && !item.placeholder && (
                <span
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    background: "#ef4444",
                  }}
                />
              )}
              {item.key === "fit-to-work-validation" && validationCount > 0 && !item.placeholder && (
                <span
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    background: "#ef4444",
                  }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Campaign Carousel - below menu */}
        {!loadingCampaigns && campaigns.length > 0 && (
          <div
            style={{
              flexShrink: 0,
              padding: "10px 0 8px",
            }}
          >
            <div
              style={{
                position: "relative",
                width: `min(${menuContentWidth}px, calc(100% - 14px))`,
                margin: 0,
                minHeight: campaignImageHeight + (compactViewport ? 70 : 78),
              }}
              onTouchStart={() => setCampaignPaused(true)}
              onTouchEnd={() => pauseCampaignTemporarily(4500)}
              onMouseEnter={() => setCampaignPaused(true)}
              onMouseLeave={() => setCampaignPaused(false)}
            >
              {campaigns.map((c, idx) => {
                const isActive = idx === campaignIndex;
                return (
                  <div
                    key={c.id}
                    onClick={() =>
                      c.deskripsi ? setReadMoreCampaign(c) : undefined
                    }
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      background: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: 14,
                      overflow: "hidden",
                      cursor: c.deskripsi ? "pointer" : "default",
                      boxShadow: "0 8px 20px rgba(15,23,42,0.20)",
                      opacity: isActive ? 1 : 0,
                      transform: isActive ? "translateX(0) scale(1)" : "translateX(6px) scale(0.985)",
                      transition:
                        "opacity 900ms ease, transform 1150ms cubic-bezier(0.22, 1, 0.36, 1)",
                      pointerEvents: isActive ? "auto" : "none",
                    }}
                  >
                    <div style={{ position: "relative", background: "#0f172a" }}>
                      {c.image_url && !failedCampaignImages[c.id] ? (
                        <img
                          src={c.image_url}
                          alt={c.judul}
                          onLoad={(e) => {
                            const ratio =
                              e.currentTarget.naturalWidth /
                              e.currentTarget.naturalHeight;
                            setCampaignImageRatios((prev) =>
                              prev[c.id] ? prev : { ...prev, [c.id]: ratio }
                            );
                          }}
                          onError={() =>
                            setFailedCampaignImages((prev) => ({
                              ...prev,
                              [c.id]: true,
                            }))
                          }
                          style={{
                            width: "100%",
                            height: campaignImageHeight,
                            objectFit: getCampaignImageFit(c),
                            background: "#0f172a",
                            display: "block",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: campaignImageHeight,
                            background:
                              "linear-gradient(145deg, rgba(59,130,246,0.42), rgba(30,41,59,0.95))",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#bfdbfe",
                            fontSize: 12,
                            fontWeight: 700,
                            letterSpacing: "0.02em",
                          }}
                        >
                          Image unavailable
                        </div>
                      )}
                    </div>
                    <div style={{ padding: "10px 12px 12px" }}>
                      <div
                        style={{
                          fontWeight: 700,
                          color: "#e5e7eb",
                          fontSize: compactViewport ? 13 : 14,
                          marginBottom: c.deskripsi ? 3 : 0,
                          lineHeight: 1.35,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {c.judul}
                      </div>
                      {c.deskripsi && (
                        <>
                          <div
                            style={{
                              color: "#9ca3af",
                              fontSize: compactViewport ? 11 : 12,
                              lineHeight: 1.4,
                              display: "-webkit-box",
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              marginBottom: 6,
                            }}
                          >
                            {getPreviewText(c.deskripsi, 70)}
                          </div>
                          <span
                            style={{
                              color: "#93c5fd",
                              fontSize: 11,
                              fontWeight: 700,
                              letterSpacing: "0.02em",
                            }}
                          >
                            Read more
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {campaigns.length > 1 && (
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <button
                  type="button"
                  onClick={goToPrevCampaign}
                  aria-label="Campaign sebelumnya"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    border: "1px solid #cbd5e1",
                    background: "#fff",
                    color: "#334155",
                    fontSize: 16,
                    lineHeight: 1,
                    cursor: "pointer",
                  }}
                >
                  &#8249;
                </button>
                {campaigns.map((_, idx) => (
                  <button
                    key={`mobile-dot-${idx}`}
                    type="button"
                    onClick={() => {
                      setCampaignIndex(idx);
                      pauseCampaignTemporarily(3000);
                    }}
                    aria-label={`Ke campaign ${idx + 1}`}
                    style={{
                      width: idx === campaignIndex ? 16 : 6,
                      height: 6,
                      borderRadius: 999,
                      border: "none",
                      background:
                        idx === campaignIndex ? "#3b82f6" : "rgba(100,116,139,0.45)",
                      cursor: "pointer",
                      transition: "all 220ms ease",
                    }}
                  />
                ))}
                <span
                  style={{
                    marginLeft: 6,
                    color: "#64748b",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {campaignIndex + 1}/{campaigns.length}
                </span>
                <button
                  type="button"
                  onClick={goToNextCampaign}
                  aria-label="Campaign berikutnya"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    border: "1px solid #cbd5e1",
                    background: "#fff",
                    color: "#334155",
                    fontSize: 16,
                    lineHeight: 1,
                    cursor: "pointer",
                  }}
                >
                  &#8250;
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {readMoreCampaign && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: "20px 20px 90px 20px",
            boxSizing: "border-box",
          }}
          onClick={() => setReadMoreCampaign(null)}
        >
          <div
            style={{
              background: "#1f2937",
              border: "1px solid #374151",
              borderRadius: 12,
              padding: 18,
              maxWidth: 500,
              width: "100%",
              maxHeight: "65vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                margin: "0 0 12px 0",
                color: "#e5e7eb",
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              {readMoreCampaign.judul}
            </h3>
            {readMoreCampaign.image_url && (
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  setFullScreenImage(readMoreCampaign.image_url);
                }}
                onKeyDown={(e) => e.key === "Enter" && setFullScreenImage(readMoreCampaign.image_url)}
                style={{
                  cursor: "pointer",
                  marginBottom: 12,
                }}
              >
                <img
                  src={readMoreCampaign.image_url}
                  alt={readMoreCampaign.judul}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                  style={{
                    width: "100%",
                    maxHeight: 140,
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
                <div
                  style={{
                    fontSize: 11,
                    color: "#60a5fa",
                    marginTop: 4,
                  }}
                >
                  Ketuk untuk lihat ukuran penuh
                </div>
              </div>
            )}
            <div
              style={{
                color: "#9ca3af",
                fontSize: 13,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {parseTextWithLinks(readMoreCampaign.deskripsi)}
            </div>
            <button
              type="button"
              onClick={() => setReadMoreCampaign(null)}
              style={{
                marginTop: 14,
                padding: "8px 18px",
                background: "#374151",
                color: "#e5e7eb",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {fullScreenImage && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.95)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1200,
            padding: 20,
            boxSizing: "border-box",
          }}
          onClick={() => setFullScreenImage(null)}
        >
          <img
            src={fullScreenImage}
            alt="Full size"
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Bottom Navigation */}
      <MobileBottomNavigation
        activeTab="home"
        tasklistTodoCount={tasklistTodoCount}
        onNavigate={(tab) => {
          if (tab === "home") {
            // Already on home
          } else if (tab === "tasklist") {
            onNavigate("tasklist");
          } else if (tab === "profile") {
            onNavigate("profile");
          }
        }}
      />
    </div>
    </>
  );
}

export default HomeMobile;

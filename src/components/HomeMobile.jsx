import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import MobileBottomNavigation from "./MobileBottomNavigation";

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

// Hanya jabatan validator yang boleh melihat menu Validasi Fit To Work (bukan Quality Control, Operator MMU, Crew, Blaster).
function canAccessFitToWorkValidation(user) {
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

function HomeMobile({ user, onNavigate, validationCount = 0 }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [readMoreCampaign, setReadMoreCampaign] = useState(null);
  const [campaignIndex, setCampaignIndex] = useState(0);
  const campaignScrollRef = useRef(null);
  const campaignIndexRef = useRef(0);
  campaignIndexRef.current = campaignIndex;

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
    if (campaigns.length <= 1 || !campaignScrollRef.current) return;
    const el = campaignScrollRef.current;
    const stepWidth = Math.min(320, window.innerWidth - 48) + 12;
    const scrollDuration = 2500; // 2.5 detik per slide (bergerak perlahan)
    const pauseBetween = 5000; // jeda 5 detik setelah selesai slide

    let timeoutId;
    let rafId;
    const scrollToNext = () => {
      const currentIdx = campaignIndexRef.current;
      const nextIdx = (currentIdx + 1) % campaigns.length;
      const targetLeft = nextIdx * stepWidth;
      const startLeft = el.scrollLeft;
      const startTime = performance.now();

      const animate = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / scrollDuration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 2); // ease-out
        el.scrollLeft = startLeft + (targetLeft - startLeft) * easeProgress;

        if (progress < 1) {
          rafId = requestAnimationFrame(animate);
        } else {
          setCampaignIndex(nextIdx);
          timeoutId = setTimeout(scrollToNext, pauseBetween);
        }
      };
      rafId = requestAnimationFrame(animate);
    };

    timeoutId = setTimeout(scrollToNext, pauseBetween);
    return () => {
      clearTimeout(timeoutId);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [campaigns.length]);
  const allMenuItems = [
    {
      key: "fit-to-work",
      label: "Fit To Work",
      icon: "👷",
      color: "#3b82f6",
      description: "Formulir kelayakan kerja",
    },
    {
      key: "fit-to-work-validation",
      label: "Validasi Fit To Work",
      icon: "✅",
      color: "#10b981",
      description: "Validasi kelayakan kerja",
    },
    {
      key: "take-5",
      label: "Take 5",
      icon: "⏰",
      color: "#f59e0b",
      description: "Pemeriksaan 5 menit",
    },
    {
      key: "hazard",
      label: "Hazard Report",
      icon: "⚠️",
      color: "#ef4444",
      description: "Laporan bahaya",
    },
    {
      key: "pto",
      label: "PTO",
      icon: "📋",
      color: "#8b5cf6",
      description: "Planned Task Observation",
    },
  ];

  const menuItems = allMenuItems.filter(
    (item) =>
      item.key !== "fit-to-work-validation" ||
      canAccessFitToWorkValidation(user)
  );

  return (
    <>
    <style>{`
      .mobile-campaign-scroll::-webkit-scrollbar { display: none; }
    `}</style>
    <div
      style={{
        width: "100%",
        height: "100vh",
        maxHeight: "100dvh",
        background: "#f8fafc",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        paddingBottom: 70, // Space untuk bottom nav
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

      {/* Menu + Campaign - scroll bersama */}
      <div
        className="mobile-home-menu"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "8px 20px 0",
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
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 10,
            flexShrink: 0,
            paddingRight: 14,
            boxSizing: "border-box",
          }}
        >
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className="mobile-home-menu-item"
              style={{
                background: "white",
                border: "none",
                borderRadius: 16,
                padding: "14px 16px",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                transition: "all 0.2s ease",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 12,
                minHeight: 64,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
              }}
            >
              <div
                className="mobile-home-menu-icon"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "10px",
                  background: `${item.color}20`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </div>
              <div className="mobile-home-menu-text" style={{ flex: 1, minWidth: 0 }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#1f2937",
                    marginBottom: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {item.label}
                  {item.key === "fit-to-work-validation" && validationCount > 0 && (
                    <span
                      style={{
                        background: "#ef4444",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 700,
                        minWidth: 22,
                        height: 22,
                        borderRadius: 11,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0 6px",
                      }}
                    >
                      {validationCount > 99 ? "99+" : validationCount}
                    </span>
                  )}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: "#6b7280",
                    lineHeight: 1.3,
                  }}
                >
                  {item.description}
                </p>
              </div>
              <div
                style={{
                  color: item.color,
                  fontSize: 20,
                  opacity: 0.7,
                  flexShrink: 0,
                }}
              >
                →
              </div>
            </button>
          ))}
        </div>

        {/* Campaign Carousel - below menu */}
        {!loadingCampaigns && campaigns.length > 0 && (
          <div
            style={{
              flexShrink: 0,
              padding: "12px 0 16px",
            }}
          >
            <div
              ref={campaignScrollRef}
              className="mobile-campaign-scroll"
              style={{
                display: "flex",
                gap: 12,
                overflowX: "auto",
                overflowY: "hidden",
                scrollSnapType: "x mandatory",
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                paddingLeft: 20,
                paddingRight: 20,
                boxSizing: "border-box",
              }}
              onScroll={(e) => {
                const el = e.target;
                const cardWidth = Math.min(320, window.innerWidth - 48);
                const gap = 12;
                const idx = Math.round(el.scrollLeft / (cardWidth + gap));
                const clamped = Math.min(idx, campaigns.length - 1);
                if (clamped >= 0) {
                  setCampaignIndex(clamped);
                }
              }}
            >
              {campaigns.map((c) => {
                const cardWidth = Math.min(320, window.innerWidth - 48);
                return (
                  <div
                    key={c.id}
                    onClick={() =>
                      c.deskripsi ? setReadMoreCampaign(c) : undefined
                    }
                    style={{
                      flexShrink: 0,
                      width: cardWidth,
                      scrollSnapAlign: "start",
                      background: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: 12,
                      overflow: "hidden",
                      cursor: c.deskripsi ? "pointer" : "default",
                    }}
                  >
                    {c.image_url && (
                      <img
                        src={c.image_url}
                        alt={c.judul}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                        style={{
                          width: "100%",
                          height: 90,
                          objectFit: "cover",
                        }}
                      />
                    )}
                    <div style={{ padding: 10 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          color: "#e5e7eb",
                          fontSize: 14,
                          marginBottom: c.deskripsi ? 4 : 0,
                        }}
                      >
                        {c.judul}
                      </div>
                      {c.deskripsi && (
                        <span
                          style={{
                            color: "#60a5fa",
                            fontSize: 12,
                            textDecoration: "underline",
                          }}
                        >
                          Read more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => setReadMoreCampaign(null)}
        >
          <div
            style={{
              background: "#1f2937",
              border: "1px solid #374151",
              borderRadius: 12,
              padding: 24,
              maxWidth: 500,
              width: "100%",
              maxHeight: "80vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                margin: "0 0 16px 0",
                color: "#e5e7eb",
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              {readMoreCampaign.judul}
            </h3>
            {readMoreCampaign.image_url && (
              <img
                src={readMoreCampaign.image_url}
                alt={readMoreCampaign.judul}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
                style={{
                  width: "100%",
                  maxHeight: 240,
                  objectFit: "cover",
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              />
            )}
            <div
              style={{
                color: "#9ca3af",
                fontSize: 14,
                lineHeight: 1.6,
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
                marginTop: 20,
                padding: "10px 20px",
                background: "#374151",
                color: "#e5e7eb",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <MobileBottomNavigation
        activeTab="home"
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

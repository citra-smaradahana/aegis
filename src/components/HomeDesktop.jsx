import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";

const urlRegex = /(https?:\/\/[^\s]+)/g;

const carouselKeyframes = `
  @keyframes pushInFromRight {
    from { opacity: 0.35; transform: translateX(250px) scale(0.54); }
    to { opacity: 1; transform: translateX(0) scale(1); }
  }
  @keyframes pushOutToLeft {
    from { opacity: 1; transform: translateX(250px) scale(1); }
    to { opacity: 0.35; transform: translateX(0) scale(0.54); }
  }
  @keyframes emergeFromRight {
    from { opacity: 0.2; transform: translateX(80px) scale(0.54); }
    to { opacity: 0.35; transform: translateX(0) scale(0.54); }
  }
`;

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

function HomeDesktop({ user }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readMoreCampaign, setReadMoreCampaign] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevIndexRef = useRef(0);

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
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (campaigns.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % campaigns.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [campaigns.length]);

  useEffect(() => {
    const t = setTimeout(() => {
      prevIndexRef.current = currentIndex;
    }, 1900);
    return () => clearTimeout(t);
  }, [currentIndex]);

  const goToNext = () => {
    if (isAnimating || campaigns.length <= 1) return;
    prevIndexRef.current = currentIndex;
    setIsAnimating(true);
    setCurrentIndex((i) => (i + 1) % campaigns.length);
    setTimeout(() => setIsAnimating(false), 1900);
  };

  const renderCampaignCard = (c, { size = "large", opacity = 1, onClick } = {}) => {
    const isLarge = size === "large";
    const cardWidth = isLarge ? 480 : 260;
    const imgHeight = isLarge ? 260 : 140;
    const padding = isLarge ? 24 : 16;
    const titleSize = isLarge ? 22 : 15;
    const linkSize = isLarge ? 15 : 13;
    return (
      <div
        key={c.id}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
        style={{
          background: "#1f2937",
          border: "1px solid #374151",
          borderRadius: 12,
          overflow: "hidden",
          flexShrink: 0,
          width: cardWidth,
          opacity,
          transition: "all 0.3s ease",
          cursor: onClick ? "pointer" : "default",
        }}
      >
        {c.image_url && (
          <img
            src={c.image_url}
            alt={c.judul}
            onError={(e) => { e.target.style.display = "none"; }}
            style={{
              width: "100%",
              height: imgHeight,
              objectFit: "cover",
            }}
          />
        )}
        <div style={{ padding }}>
          <div
            style={{
              fontWeight: 700,
              color: "#e5e7eb",
              fontSize: titleSize,
              marginBottom: c.deskripsi ? 12 : 0,
            }}
          >
            {c.judul}
          </div>
          {c.deskripsi && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setReadMoreCampaign(c); }}
              style={{
                background: "none",
                border: "none",
                color: "#60a5fa",
                fontSize: linkSize,
                cursor: "pointer",
                padding: 0,
                textDecoration: "underline",
              }}
            >
              Read more
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        width: "100%",
        minHeight: "calc(100vh - 80px)",
        display: "flex",
        flexDirection: "column",
        padding: "40px 20px",
        boxSizing: "border-box",
      }}
    >
      <style>{carouselKeyframes}</style>
      <div
        style={{
          width: "100%",
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 40px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
        }}
      >
        <div
          style={{
            marginBottom: 24,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#f3f4f6",
              letterSpacing: "-0.02em",
            }}
          >
            Selamat datang, {user?.nama || user?.user || "Pengguna"}
          </div>
          <div
            style={{
              fontSize: 14,
              color: "#9ca3af",
              fontWeight: 500,
            }}
          >
            {user?.jabatan || "Karyawan"} · AEGIS KMB Safety Management
          </div>
        </div>

        {loading ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#9ca3af",
            }}
          >
            Memuat...
          </div>
        ) : campaigns.length > 0 ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 20,
                overflow: "visible",
              }}
            >
            {campaigns.length === 1 ? (
              renderCampaignCard(campaigns[0], {
                size: "large",
                onClick: () =>
                  campaigns[0].deskripsi && setReadMoreCampaign(campaigns[0]),
              })
            ) : (
              <>
                {(() => {
                  const prevIdx =
                    (currentIndex - 1 + campaigns.length) % campaigns.length;
                  const nextIdx = (currentIndex + 1) % campaigns.length;
                  const prev = campaigns[prevIdx];
                  const curr = campaigns[currentIndex];
                  const next = campaigns[nextIdx];
                  const justAdvanced =
                    currentIndex !== prevIndexRef.current;
                  const animDur = "1.8s";
                  const scaleSmall = 260 / 480;
                  return (
                    <>
                      <div
                        key={`prev-${prevIdx}-${currentIndex}`}
                        style={{
                          width: 260,
                          flexShrink: 0,
                          display: "flex",
                          justifyContent: "flex-end",
                          transformOrigin: "center center",
                          animation: justAdvanced
                            ? `pushOutToLeft ${animDur} ease forwards`
                            : "none",
                          opacity: justAdvanced ? undefined : 0.35,
                          transform: justAdvanced ? undefined : `scale(${scaleSmall})`,
                        }}
                      >
                        {renderCampaignCard(prev, {
                          size: "large",
                          onClick: undefined,
                        })}
                      </div>
                      <div
                        key={`curr-${curr.id}-${currentIndex}`}
                        style={{
                          width: 480,
                          flexShrink: 0,
                          display: "flex",
                          justifyContent: "center",
                          transformOrigin: "center center",
                          animation: justAdvanced
                            ? `pushInFromRight ${animDur} ease forwards`
                            : "none",
                        }}
                      >
                        {renderCampaignCard(curr, {
                          size: "large",
                          onClick: () =>
                            curr.deskripsi && setReadMoreCampaign(curr),
                        })}
                      </div>
                      <div
                        style={{
                          width: 260,
                          flexShrink: 0,
                          display: "flex",
                          justifyContent: "flex-start",
                          transformOrigin: "center center",
                          animation: justAdvanced
                            ? `emergeFromRight ${animDur} ease forwards`
                            : "none",
                          opacity: justAdvanced ? undefined : 0.35,
                          transform: justAdvanced ? undefined : `scale(${scaleSmall})`,
                        }}
                      >
                        {renderCampaignCard(next, {
                          size: "large",
                          onClick: () => goToNext(),
                        })}
                      </div>
                    </>
                  );
                })()}
              </>
            )}
            </div>
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                background: "#1f2937",
                border: "1px dashed #374151",
                borderRadius: 12,
                padding: 48,
                textAlign: "center",
                color: "#6b7280",
                fontSize: 14,
              }}
            >
              Belum ada kampanye atau berita untuk ditampilkan.
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
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              {readMoreCampaign.judul}
            </h3>
            {readMoreCampaign.image_url && (
              <img
                src={readMoreCampaign.image_url}
                alt={readMoreCampaign.judul}
                onError={(e) => { e.target.style.display = "none"; }}
                style={{
                  width: "100%",
                  maxHeight: 280,
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
    </div>
  );
}

export default HomeDesktop;

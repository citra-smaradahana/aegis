import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

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

function getPreviewText(text, maxLength = 180) {
  if (!text) return "";
  const cleanText = text
    .replace(urlRegex, "")
    .replace(/\s+/g, " ")
    .replace(/\s*-\s*/g, " - ")
    .trim();
  if (cleanText.length <= maxLength) return cleanText;
  return `${cleanText.slice(0, maxLength).trimEnd()}...`;
}

function getCircularDistance(index, activeIndex, total) {
  if (total <= 1) return 0;
  let diff = index - activeIndex;
  const half = total / 2;
  if (diff > half) diff -= total;
  if (diff < -half) diff += total;
  return diff;
}

function HomeDesktop({ user }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readMoreCampaign, setReadMoreCampaign] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [failedImages, setFailedImages] = useState({});
  const [imageRatios, setImageRatios] = useState({});

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
    if (campaigns.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % campaigns.length);
    }, 12000);
    return () => clearInterval(timer);
  }, [campaigns.length, isPaused]);

  const goToNext = () => {
    if (campaigns.length <= 1) return;
    setCurrentIndex((i) => (i + 1) % campaigns.length);
  };

  const goToPrev = () => {
    if (campaigns.length <= 1) return;
    setCurrentIndex((i) => (i - 1 + campaigns.length) % campaigns.length);
  };

  const getImageFit = (campaign) => {
    if (campaign?.image_fit === "contain" || campaign?.image_fit === "cover") {
      return campaign.image_fit;
    }
    const ratio = imageRatios[campaign?.id];
    if (!ratio) return "cover";
    return ratio < 1.2 ? "contain" : "cover";
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
              overflow: "visible",
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 980,
                position: "relative",
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "linear-gradient(135deg, rgba(31,41,55,0.96), rgba(17,24,39,0.96))",
                boxShadow: "0 24px 80px rgba(2, 6, 23, 0.45)",
                overflow: "hidden",
              }}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <div style={{ position: "relative", height: 420, perspective: 1400, transformStyle: "preserve-3d" }}>
                {campaigns.map((c, idx) => {
                  const distance = getCircularDistance(idx, currentIndex, campaigns.length);
                  const absDistance = Math.abs(distance);
                  const isActive = idx === currentIndex;
                  const isNear = absDistance === 1;

                  return (
                    <article
                      key={c.id}
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "grid",
                        gridTemplateColumns: "1.1fr 1fr",
                        alignItems: "stretch",
                        transform: `
                          translateX(${isActive ? 0 : distance > 0 ? 12 : -12}%)
                          rotateY(${isActive ? 0 : distance > 0 ? -16 : 16}deg)
                          translateZ(${isActive ? 56 : isNear ? -40 : -120}px)
                          scale(${isActive ? 1.02 : isNear ? 0.9 : 0.84})
                        `,
                        opacity: isActive ? 1 : 0,
                        filter: isActive ? "none" : "saturate(0.88)",
                        transition:
                          "transform 1200ms cubic-bezier(0.22, 1, 0.36, 1), opacity 920ms ease, filter 920ms ease",
                        transformOrigin: "center center",
                        zIndex: isActive ? 3 : isNear ? 2 : 1,
                        willChange: "transform, opacity, filter",
                        pointerEvents: isActive ? "auto" : "none",
                      }}
                    >
                      <div style={{ position: "relative", minHeight: 420, background: "#0f172a" }}>
                        {c.image_url && !failedImages[c.id] ? (
                          <img
                            src={c.image_url}
                            alt={c.judul}
                            onLoad={(e) => {
                              const ratio = e.currentTarget.naturalWidth / e.currentTarget.naturalHeight;
                              setImageRatios((prev) => (prev[c.id] ? prev : { ...prev, [c.id]: ratio }));
                            }}
                            onError={(e) => {
                              setFailedImages((prev) => ({ ...prev, [c.id]: true }));
                            }}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: getImageFit(c),
                              background: "#0f172a",
                              transform: isActive ? "scale(1.035)" : "scale(1)",
                              transition: "transform 1300ms cubic-bezier(0.22, 1, 0.36, 1)",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              background:
                                "linear-gradient(145deg, rgba(59,130,246,0.42), rgba(30,41,59,0.95))",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#bfdbfe",
                              fontWeight: 700,
                              fontSize: 14,
                              letterSpacing: "0.02em",
                            }}
                          >
                            Image preview unavailable
                          </div>
                        )}
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background:
                              "linear-gradient(to top, rgba(15,23,42,0.72), rgba(15,23,42,0.1) 45%, rgba(15,23,42,0))",
                          }}
                        />
                      </div>

                      <div
                        style={{
                          padding: "28px 30px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          gap: 14,
                        }}
                      >
                        <div
                          style={{
                            fontSize: "clamp(28px, 2.5vw, 42px)",
                            lineHeight: 1.2,
                            fontWeight: 800,
                            color: "#f9fafb",
                            letterSpacing: "-0.02em",
                          }}
                        >
                          {c.judul}
                        </div>
                        {c.deskripsi && (
                          <p
                            style={{
                              margin: 0,
                              color: "#9ca3af",
                              fontSize: 14,
                              lineHeight: 1.6,
                              maxHeight: 74,
                              overflow: "hidden",
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {getPreviewText(c.deskripsi)}
                          </p>
                        )}
                        {c.deskripsi && (
                          <button
                            type="button"
                            onClick={() => setReadMoreCampaign(c)}
                            style={{
                              alignSelf: "flex-start",
                              marginTop: 8,
                              borderRadius: 999,
                              border: "1px solid rgba(147,197,253,0.65)",
                              background: "linear-gradient(135deg, rgba(37,99,235,0.45), rgba(59,130,246,0.28))",
                              color: "#eff6ff",
                              padding: "9px 15px",
                              fontSize: 12,
                              fontWeight: 700,
                              letterSpacing: "0.02em",
                              cursor: "pointer",
                              transition: "all 200ms ease",
                            }}
                          >
                            Read more
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              {campaigns.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goToPrev}
                    aria-label="Slide sebelumnya"
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: 14,
                      transform: "translateY(-50%)",
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      border: "1px solid rgba(255,255,255,0.2)",
                      background: "rgba(15,23,42,0.55)",
                      color: "#e5e7eb",
                      cursor: "pointer",
                      fontSize: 20,
                      lineHeight: 1,
                      backdropFilter: "blur(3px)",
                    }}
                  >
                    &#8249;
                  </button>

                  <button
                    type="button"
                    onClick={goToNext}
                    aria-label="Slide berikutnya"
                    style={{
                      position: "absolute",
                      top: "50%",
                      right: 14,
                      transform: "translateY(-50%)",
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      border: "1px solid rgba(255,255,255,0.2)",
                      background: "rgba(15,23,42,0.55)",
                      color: "#e5e7eb",
                      cursor: "pointer",
                      fontSize: 20,
                      lineHeight: 1,
                      backdropFilter: "blur(3px)",
                    }}
                  >
                    &#8250;
                  </button>

                  <div
                    style={{
                      position: "absolute",
                      bottom: 14,
                      left: "50%",
                      transform: "translateX(-50%)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      borderRadius: 999,
                      background: "rgba(15,23,42,0.52)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    {campaigns.map((_, idx) => (
                      <button
                        key={`dot-${idx}`}
                        type="button"
                        onClick={() => setCurrentIndex(idx)}
                        aria-label={`Ke slide ${idx + 1}`}
                        style={{
                          width: idx === currentIndex ? 20 : 8,
                          height: 8,
                          borderRadius: 999,
                          border: "none",
                          background:
                            idx === currentIndex
                              ? "#60a5fa"
                              : "rgba(255,255,255,0.38)",
                          cursor: "pointer",
                          transition: "all 280ms ease",
                        }}
                      />
                    ))}
                    <div
                      style={{
                        marginLeft: 6,
                        color: "#cbd5e1",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.02em",
                        opacity: 0.9,
                      }}
                    >
                      {currentIndex + 1}/{campaigns.length}
                    </div>
                  </div>
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
              borderRadius: 14,
              padding: 20,
              maxWidth: 980,
              width: "min(96vw, 980px)",
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
                  maxHeight: "72vh",
                  objectFit: "contain",
                  borderRadius: 10,
                  marginBottom: 14,
                  background: "#0f172a",
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

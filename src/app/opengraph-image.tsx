import { ImageResponse } from "next/og";

export const alt = "hired.log — Free Job Application Tracker & Job Hunt Manager";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f1117 0%, #1a1d27 50%, #242836 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "#6366f1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 20,
              fontSize: 32,
              fontWeight: 800,
              color: "white",
              fontFamily: "monospace",
            }}
          >
            &gt;_
          </div>
          <div style={{ display: "flex", fontSize: 52, fontWeight: 800, color: "#e8eaf0" }}>
            hired
            <span style={{ color: "#6366f1" }}>.log</span>
          </div>
        </div>
        <div
          style={{
            fontSize: 24,
            color: "#9ca3b4",
            maxWidth: 600,
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Free job application tracker. Log applications, track interviews, land offers.
        </div>
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 40,
          }}
        >
          {["Applied", "Interview", "Offer", "Accepted"].map((s, i) => (
            <div
              key={s}
              style={{
                padding: "10px 24px",
                borderRadius: 24,
                fontSize: 16,
                fontWeight: 600,
                color: ["#6366f1", "#3b82f6", "#10b981", "#059669"][i],
                background: [
                  "rgba(99,102,241,0.15)",
                  "rgba(59,130,246,0.15)",
                  "rgba(16,185,129,0.15)",
                  "rgba(5,150,105,0.15)",
                ][i],
              }}
            >
              {s}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}

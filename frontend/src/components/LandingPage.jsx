import { useEffect, useRef } from "react";

// Spline viewer is loaded via CDN script tag
// Lenis is loaded via CDN script tag

export default function LandingPage() {
  const lenisRef = useRef(null);

  useEffect(() => {
    // Load Lenis
    const lenisScript = document.createElement("script");
    lenisScript.src = "https://cdnjs.cloudflare.com/ajax/libs/lenis/1.1.14/lenis.min.js";
    lenisScript.onload = () => {
      const lenis = new window.Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smooth: true,
      });

      lenisRef.current = lenis;

      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    };
    document.head.appendChild(lenisScript);

    // Load Spline viewer custom element
    const splineScript = document.createElement("script");
    splineScript.type = "module";
    splineScript.src = "https://unpkg.com/@splinetool/viewer@1.9.96/build/spline-viewer.js";
    document.head.appendChild(splineScript);

    return () => {
      lenisRef.current?.destroy();
    };
  }, []);

  return (
    <div style={styles.page}>
      {/* Page content goes here */}
      <div style={styles.content}>
        <h1 style={styles.heading}>WELCOME to TransLuna</h1>
        <p style={styles.sub}>Your one stop AI translation workspace</p>
      </div>

      {/* Spline model — bottom-left */}
      <div style={styles.splineWrapper}>
        {/*
          Replace the `url` prop below with your actual Spline scene URL.
          Example: url="https://prod.spline.design/YOUR_SCENE_ID/scene.splinecode"
        */}
        <spline-viewer
          url="https://prod.spline.design/ahkLcICaJXzZqBOT/scene.splinecode"
          style={styles.splineViewer}
        />
      </div>
    </div>
  );
}

const styles = {
  page: {
    position: "relative",
    minHeight: "100vh",
    width: "100%",
    background:
      "linear-gradient(50deg, rgba(0,0,0,1) 0%, rgba(136,63,224,1) 80%, rgba(243,126,126,1) 100%)",
    overflow: "hidden",
    fontFamily: "'Segoe UI', sans-serif",
  },
  content: {
    position: "relative",
    zIndex: 2,
    padding: "80px 60px",
    color: "#fff",
  },
  heading: {
    fontSize: "4rem",
    fontWeight: 700,
    margin: 0,
    letterSpacing: "-1px",
  },
  sub: {
    marginTop: "12px",
    fontSize: "1.1rem",
    opacity: 0.6,
  },
  splineWrapper: {
    position: "fixed",
    bottom: 0,
    left: 0,
    width: "480px",
    height: "480px",
    zIndex: 1,
    pointerEvents: "auto",
  },
  splineViewer: {
    width: "100%",
    height: "100%",
    background: "transparent",
  },
};
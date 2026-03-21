import { useState } from "react"
import { useCamera } from "./hooks/useCamera"
import { useFaceApi } from "./hooks/useFaceApi"

export default function App() {
  const [url, setUrl] = useState("")
  const [stream, setStream] = useState(null)
  const { ready, progress } = useFaceApi()
  const { imgRef, active, lastCapture, faces, start, stop } = useCamera()

  const handleStart = () => {
    if (!url.trim()) return
    setStream(url.trim())
  }

  const handleStop = () => {
    stop()
    setStream(null)
  }

  return (
    <div style={{ padding: 20, fontFamily: "monospace", background: "#0a0a0a", minHeight: "100vh", color: "#fff" }}>
      <h2 style={{ color: "#00c8ff", marginBottom: 4 }}>OmniGuard — Camera Test</h2>

      {/* Status IA */}
      <p style={{ color: ready ? "#00ff88" : "#ffd600", marginBottom: 16, fontSize: 13 }}>
        {ready ? "✅ Modèles IA prêts" : `⏳ ${progress}`}
      </p>

      {/* Input URL */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <input
          type="text"
          placeholder="http://192.168.8.101:8080/video"
          value={url}
          onChange={e => setUrl(e.target.value)}
          style={{ flex: 1, padding: "8px 12px", background: "#111", border: "1px solid #333", color: "#fff", fontFamily: "monospace", borderRadius: 3 }}
        />
        <button onClick={handleStart} style={{ padding: "8px 16px", background: "#00c8ff", color: "#000", border: "none", borderRadius: 3, cursor: "pointer" }}>
          START
        </button>
        <button onClick={handleStop} style={{ padding: "8px 16px", background: "#ff3355", color: "#fff", border: "none", borderRadius: 3, cursor: "pointer" }}>
          STOP
        </button>
      </div>

      {/* Boutons capture */}
      {stream && (
        <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
          <button
            onClick={() => start([])} // [] = pas de profils = tout le monde est inconnu
            disabled={active || !ready}
            style={{ padding: "8px 16px", background: active || !ready ? "#333" : "#00ff88", color: "#000", border: "none", borderRadius: 3, cursor: active || !ready ? "not-allowed" : "pointer" }}
          >
            ▶ DÉMARRER ANALYSE
          </button>
          <button
            onClick={stop}
            disabled={!active}
            style={{ padding: "8px 16px", background: !active ? "#333" : "#ff3355", color: "#fff", border: "none", borderRadius: 3, cursor: !active ? "not-allowed" : "pointer" }}
          >
            ■ ARRÊTER
          </button>
          {active && (
            <span style={{ color: "#ffd600", fontSize: 13 }}>
              👤 {faces} visage(s) détecté(s) — photo envoyée toutes les 3s si inconnu
            </span>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 20 }}>
        {/* Flux vidéo */}
        {stream ? (
          <div style={{ flex: 1 }}>
            <p style={{ color: "#00ff88", marginBottom: 8 }}>● LIVE</p>
            <img
              ref={imgRef}
              src={stream}
              alt="Camera stream"
              crossOrigin="anonymous"
              style={{ width: "100%", maxWidth: 640, border: "1px solid #333", borderRadius: 3, display: "block" }}
            />
          </div>
        ) : (
          <div style={{ flex: 1, padding: 40, border: "1px solid #333", borderRadius: 3, textAlign: "center", color: "#555" }}>
            Entre l'URL de ta caméra et clique START
          </div>
        )}

        {/* Dernière capture analysée */}
        {lastCapture && (
          <div style={{ flex: 1 }}>
            <p style={{ color: "#ffd600", marginBottom: 8 }}>📸 Dernière analyse</p>
            <img
              src={lastCapture}
              alt="Last capture"
              style={{ width: "100%", maxWidth: 640, border: "1px solid #333", borderRadius: 3, display: "block" }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
import { useState, useEffect } from "react"

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.14/model"

export function useFaceApi() {
  const [ready, setReady] = useState(false)
  const [progress, setProgress] = useState("Initialisation...")
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    const loadModels = async () => {
      try {
        // Charger le script face-api.js depuis CDN si pas encore chargé
        if (!window.faceapi) {
          setProgress("Chargement face-api.js...")
          await new Promise((res, rej) => {
            const script = document.createElement("script")
            script.src = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js"
            script.onload = res
            script.onerror = () => rej(new Error("Impossible de charger face-api.js"))
            document.head.appendChild(script)
          })
        }

        if (cancelled) return
        const faceapi = window.faceapi

        // Charger les 3 modèles nécessaires
        setProgress("Chargement modèle détection...")
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)

        setProgress("Chargement modèle landmarks...")
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)

        setProgress("Chargement modèle reconnaissance...")
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)

        if (cancelled) return
        setReady(true)
        setProgress("Prêt ✅")
      } catch (e) {
        if (!cancelled) setError(e.message)
      }
    }

    loadModels()
    return () => { cancelled = true }
  }, [])

  return { ready, progress, error }
}
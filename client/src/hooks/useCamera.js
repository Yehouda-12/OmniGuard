import { useRef, useState, useCallback, useEffect } from "react"
import socket from "../socket"

export function useCamera() {
  const imgRef = useRef(null)
  const intervalRef = useRef(null)
  const [active, setActive] = useState(false)
  const [lastCapture, setLastCapture] = useState(null)
  const [faces, setFaces] = useState(0)

  // Capturer une photo + canvas depuis le flux <img>
  const capture = useCallback(() => {
    const img = imgRef.current
    if (!img || !img.complete) return null

    const canvas = document.createElement("canvas")
    canvas.width = img.naturalWidth || 640
    canvas.height = img.naturalHeight || 480
    canvas.getContext("2d").drawImage(img, 0, 0)

    return { photo: canvas.toDataURL("image/jpeg", 0.8), canvas }
  }, [])

  // Démarrer analyse toutes les 3 secondes
  const start = useCallback((profiles = []) => {
    const faceapi = window.faceapi
    if (!faceapi) return console.error("face-api.js pas chargé")

    setActive(true)

    intervalRef.current = setInterval(async () => {
      const result = capture()
      if (!result) return

      setLastCapture(result.photo)

      // Options détection
      const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: 224,
        scoreThreshold: 0.5
      })

      // Analyser le canvas
      const detections = await faceapi
        .detectAllFaces(result.canvas, options)
        .withFaceLandmarks()
        .withFaceDescriptors()

      setFaces(detections.length)

      if (detections.length === 0) return

      // Comparer avec les profils enregistrés
      let isUnknown = true

      if (profiles.length > 0) {
        const labeled = profiles.map(p =>
          new faceapi.LabeledFaceDescriptors(p.name, [new Float32Array(p.descriptor)])
        )
        const matcher = new faceapi.FaceMatcher(labeled, 0.5)
        const match = matcher.findBestMatch(detections[0].descriptor)
        isUnknown = match.label === "unknown"
        console.log("👤 Visage détecté :", match.label, match.distance.toFixed(2))
      }

      // Si visage inconnu → envoyer photo au serveur
      if (isUnknown) {
        console.log("🚨 Visage inconnu ! Envoi au serveur...")
        socket.emit("photo", {
          image: result.photo,
          timestamp: new Date().toISOString(),
          cameraName: "Camera IP"
        })
      }

    }, 3000)
  }, [capture])

  // Arrêter
  const stop = useCallback(() => {
    clearInterval(intervalRef.current)
    setActive(false)
    setLastCapture(null)
    setFaces(0)
  }, [])

  useEffect(() => {
    return () => clearInterval(intervalRef.current)
  }, [])

  // Confirmation serveur
  useEffect(() => {
    socket.on("photo_received", (data) => {
      console.log("✅ Serveur a reçu la photo :", data.filename)
    })
    return () => socket.off("photo_received")
  }, [])

  return { imgRef, active, lastCapture, faces, start, stop, capture }
}
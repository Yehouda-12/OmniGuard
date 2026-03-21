import express from "express"
import http from "http"
import cors from "cors"
import dotenv from "dotenv"
import { Server } from "socket.io"
import { mkdirSync, writeFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import axios from "axios"
import FormData from "form-data"
import https from "https"

const httpsAgent = new https.Agent({ rejectUnauthorized: false })

dotenv.config()

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] }
})

app.use(cors({ origin: "http://localhost:5173" }))
app.use(express.json({ limit: "10mb" }))

mkdirSync(join(__dirname, "captures"), { recursive: true })

// ─── Envoyer photo sur Telegram ───────────────────────────────────────────────
const sendTelegram = async (imageBase64, cameraName, timestamp) => {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  console.log("Token:", token)
console.log("ChatId:", chatId)
console.log("URL:", `https://api.telegram.org/bot${token}/sendPhoto`)
  if (!token || !chatId) return console.log("⚠️ Token ou Chat ID manquant dans .env")

  try {
    const base64Data = imageBase64.replace(/^data:image\/jpeg;base64,/, "")
    const buffer = Buffer.from(base64Data, "base64")

    const form = new FormData()
    form.append("chat_id", chatId)
    form.append("photo", buffer, { filename: "capture.jpg", contentType: "image/jpeg" })
    form.append("caption", `⚠️ OmniGuard — Intrus détecté\n📍 Caméra: ${cameraName}\n🕐 ${new Date(timestamp).toLocaleString("fr-FR")}`)

    const response = await axios.post(
      `https://api.telegram.org/bot${token}/sendPhoto`,
      form,
      { headers: form.getHeaders(), httpsAgent }
    )

    if (response.data.ok) {
      console.log("📱 Photo envoyée sur Telegram ✅")
    } else {
      console.log("❌ Erreur Telegram :", response.data.description)
    }
  } catch (e) {
    console.log("❌ Erreur envoi Telegram :", e.message)
  }
}

// ─── Route relay caméra IP ────────────────────────────────────────────────────
app.get("/stream", async (req, res) => {
  const camUrl = req.query.url
  if (!camUrl) return res.status(400).json({ error: "URL manquante" })

  try {
    const response = await fetch(camUrl)
    res.setHeader("Content-Type", response.headers.get("content-type") || "multipart/x-mixed-replace")
    res.setHeader("Cache-Control", "no-cache")
    response.body.pipeTo(
      new WritableStream({
        write(chunk) { res.write(chunk) },
        close() { res.end() }
      })
    )
  } catch (e) {
    res.status(500).json({ error: "Impossible de se connecter à la caméra" })
  }
})

// ─── Socket.io ────────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log("✅ Client connecté :", socket.id)

  socket.on("photo", async (data) => {
    const { image, timestamp, cameraName } = data
    console.log("📸 Photo reçue à", timestamp)

    // Sauvegarder la photo
    const filename = `capture_${Date.now()}.jpg`
    const filepath = join(__dirname, "captures", filename)
    const base64Data = image.replace(/^data:image\/jpeg;base64,/, "")
    const buffer = Buffer.from(base64Data, "base64")
    writeFileSync(filepath, buffer)
    console.log("💾 Photo sauvegardée :", filename)

    // Envoyer sur Telegram
    await sendTelegram(image, cameraName, timestamp)

    // Confirmer au client
    socket.emit("photo_received", { filename, timestamp })
  })

  socket.on("disconnect", () => {
    console.log("❌ Client déconnecté :", socket.id)
  })
})

const PORT = process.env.PORT || 5000
server.listen(PORT, () => console.log(`✅ Serveur lancé sur http://localhost:${PORT}`))
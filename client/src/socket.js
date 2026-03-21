import { io } from "socket.io-client"

// Connexion au serveur Node.js
const socket = io("http://localhost:5000")

socket.on("connect", () => {
  console.log("✅ Socket.io connecté :", socket.id)
})

socket.on("disconnect", () => {
  console.log("❌ Socket.io déconnecté")
})

export default socket
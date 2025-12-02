// src/chat.js
import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import CryptoJS from "crypto-js";
import "./Chat.css";

const socket = io();

// Demo secret key (keep same as before)
const SECRET_KEY = "my_super_secret_key_123";

function encrypt(text) {
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
}

function decrypt(ciphertext) {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8) || "[decrypt error]";
  } catch (e) {
    return "[decrypt error]";
  }
}

function Chat({ username }) {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  // 1) Load saved messages from localStorage on first mount
  useEffect(() => {
    const saved = localStorage.getItem("messages");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setChat(parsed); // already decrypted form
        }
      } catch (e) {
        console.error("Failed to parse saved messages", e);
      }
    }
  }, []);

  // 2) Listen for encrypted messages from server, decrypt, append
  useEffect(() => {
    const handler = (data) => {
      const decryptedText = decrypt(data.text);
      setChat((prev) => [...prev, { ...data, text: decryptedText }]);
    };

    socket.on("receive_message", handler);
    return () => {
      socket.off("receive_message", handler);
    };
  }, []);

  // 3) Persist chat (decrypted) to localStorage whenever it changes
  useEffect(() => {
    if (chat.length > 0) {
      localStorage.setItem("messages", JSON.stringify(chat));
    }
  }, [chat]);

  const sendMessage = () => {
    if (message.trim()) {
      const encryptedText = encrypt(message.trim());
      socket.emit("send_message", { user: username, text: encryptedText });
      setMessage("");
    }
  };

  return (
    <div className="chat-container">
      <h2 className="chat-title">Ahoy, {username}! ⚓️</h2>
      <div className="chat-box">
        {chat.map((msg, i) => (
          <div
            key={i}
            className={`chat-message ${msg.user === username ? "me" : "other"}`}
          >
            <strong>{msg.user}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <div className="chat-input-area">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Speak like a pirate..."
          className="chat-input"
        />
        <button onClick={sendMessage} className="chat-button">
          Send 🏴‍☠️
        </button>
      </div>
    </div>
  );
}

export default Chat;
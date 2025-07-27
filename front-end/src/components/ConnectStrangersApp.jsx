import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL;
let socket;

const ConnectStrangersApp = () => {
  const [connected, setConnected] = useState(false);
  const [searching, setSearching] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [stopTapCount, setStopTapCount] = useState(0);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [disconnectMsg, setDisconnectMsg] = useState("");

  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket = io(SOCKET_URL, { autoConnect: false });
    console.log("Backend URL is:", import.meta.env.VITE_BACKEND_URL);
    socket.on("waiting", () => {
      setSearching(true);
      setDisconnectMsg("");
    });

    socket.on("partner_found", ({ roomId }) => {
      setConnected(true);
      setSearching(false);
      setRoomId(roomId);
      setMessages([{ you: true, msg: "Connected to a stranger." }]);
      setDisconnectMsg("");
    });

    socket.on("receive_message", (message) => {
      setMessages((prev) => [...prev, { you: false, msg: message }]);
    });

    socket.on("partner_disconnected", () => {
      setConnected(false);
      setRoomId(null);
      setMessages([]);
      setInput("");
      setDisconnectMsg("Stranger disconnected.");
      if (socket.connected) socket.disconnect();
    });

    return () => {
      socket.off();
      if (socket.connected) socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (connected && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, connected]);

  const handleStartStopClick = () => {
  if (!connected) {
    if (!searching) {
      // Start searching
      if (!socket.connected) socket.connect();
      setSearching(true);
      setStopTapCount(0);
      setMessages([]);
      setInput("");
      setDisconnectMsg("");
      socket.emit("find_partner");
    } else {
      // Stop searching before connected
      setSearching(false);
      setDisconnectMsg("You cancelled searching.");
      if (socket.connected) socket.disconnect();
    }
  } else if (connected) {
    // Connected state: tap once, warn; tap twice, disconnect
    setStopTapCount((count) => {
      const newCount = count + 1;
      if (newCount >= 2) {
        setConnected(false);
        setRoomId(null);
        setMessages([]);
        setInput("");
        setStopTapCount(0);
        setDisconnectMsg("You disconnected the chat.");
        if (socket.connected) socket.disconnect();
        return 0;
      }
      return newCount;
    });
  }
};


  const handleSendMessage = () => {
    if (!input.trim() || !roomId || !connected) return;
    setStopTapCount(0);
    socket.emit("send_message", { roomId, message: input });
    setMessages((prev) => [...prev, { you: true, msg: input }]);
    setInput("");
  };

  const onInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    
    <div className="flex flex-col h-screen w-full max-w-8xl mx-auto border border-gray-300 font-sans bg-indigo-700">
      <header className="p-5 bg-gradient-to-br from-indigo-700 via-indigo-500 to-indigo-700 text-white font-bold text-2xl text-center shadow-lg ">
          Stranger Link
        </header>
      <main className="flex-grow overflow-y-auto p-3 flex flex-col gap-2 bg-gradient-to-br from-indigo-200 via-gray-100 to-indigo-200">
        {searching && !connected && (
          <div className="self-center text-gray-500 italic">Searching for stranger...</div>
        )}

        {!connected && !searching && messages.length === 0 && !disconnectMsg && (
          <div className="self-center text-gray-500 italic font-semibold">
            Tap start to connect stranger....
          </div>
        )}

        {disconnectMsg && (
          <div className="self-center text-gray-500 italic font-semibold">
            {disconnectMsg}
          </div>
        )}

        {messages.length > 0 && connected && (
          <>
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-md text-base break-words transition-all duration-200 ease-in-out ${
                    m.you ? "self-end bg-blue-600 text-white rounded-br-none" : "self-start bg-gray-200 text-gray-800 rounded-bl-none"
                  }`}
              >
                {m.msg}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </main>

      <div className="flex p-2 border-t border-gray-300 bg-white gap-2">
        <button
  onClick={handleStartStopClick}
  className={`basis-24 text-white font-bold rounded-lg cursor-pointer focus:outline-none transition ${
    connected
      ? "bg-gray-500 hover:bg-gray-600"
      : searching
        ? "bg-gray-500 hover:bg-gray-600"
        : "bg-blue-600 hover:bg-blue-700"
  }`}
>
  {connected
    ? stopTapCount === 0
      ? "Stop"
      : "Stop??"
    : searching
      ? "Cancel"
      : "Start"}
</button>


        <input
          type="text"
          placeholder={
            connected
              ? "Type your message..."
              : searching
                ? "Searching for stranger..."
                : "Connect first by clicking Start"
          }
          disabled={!connected}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onInputKeyDown}
          className="flex-grow p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-gray-500"
        />
      </div>
    </div>
  );
};

export default ConnectStrangersApp;

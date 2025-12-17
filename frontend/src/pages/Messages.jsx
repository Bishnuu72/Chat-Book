import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const socket = io(API_BASE, {
  autoConnect: false,
  transports: ["websocket"],
});

const Messages = () => {
  const [friends, setFriends] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);

  // Track last message timestamp for each friend (for sorting)
  const [lastMessageTime, setLastMessageTime] = useState({});

  const chatContainerRef = useRef(null);

  const getAuthData = () => {
    const stored = localStorage.getItem("authData");
    if (!stored) return null;
    const { token, expiry, userId } = JSON.parse(stored);
    const now = Date.now();
    if (now > expiry) {
      localStorage.removeItem("authData");
      return null;
    }
    return { token, userId: Number(userId) };
  };

  const auth = getAuthData();

  const fetchLoggedInUser = async () => {
    try {
      if (!auth) return;
      const res = await fetch(`${API_BASE}/api/users/${auth.userId}`, {
        headers: { "auth-token": auth.token },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setLoggedInUser(data);
    } catch (err) {
      console.error("Error fetching logged-in user:", err.message);
    }
  };

  const fetchFriends = async () => {
    try {
      if (!auth) return;
      const res = await fetch(`${API_BASE}/api/friends/list`, {
        headers: { "auth-token": auth.token },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setFriends(data || []);
    } catch (err) {
      console.error("Error fetching friends:", err.message);
    }
  };

  const fetchMessages = async (friendId) => {
    try {
      if (!auth) return;
      const res = await fetch(`${API_BASE}/api/messages/history/${friendId}`, {
        headers: { "auth-token": auth.token },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      const normalized = (data || [])
        .map((m) => ({
          ...m,
          id: m.id ?? `${m.senderId}-${m.receiverId}-${m.createdAt}`,
          senderId: Number(m.senderId),
          receiverId: Number(m.receiverId),
          createdAt: m.createdAt,
        }))
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      setMessages(normalized);

      // Update last message time for sorting
      if (normalized.length > 0) {
        const latest = normalized[normalized.length - 1].createdAt;
        setLastMessageTime(prev => ({ ...prev, [friendId]: latest }));
      }
    } catch (err) {
      console.error("Error fetching messages:", err.message);
    }
  };

  useEffect(() => {
    fetchFriends();
    fetchLoggedInUser();

    if (auth && !socket.connected) {
      socket.connect();
      socket.emit("join", auth.userId);
    }

    return () => {
      socket.off("receiveMessage");
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const handler = (msg) => {
      const incoming = {
        ...msg,
        id: msg.id ?? `${msg.senderId}-${msg.receiverId}-${msg.createdAt}`,
        senderId: Number(msg.senderId),
        receiverId: Number(msg.receiverId),
      };

      // Update messages if this chat is open
      if (
        selectedUser &&
        (incoming.senderId === selectedUser.id || incoming.receiverId === selectedUser.id)
      ) {
        setMessages((prev) => {
          const exists = prev.some((m) => String(m.id) === String(incoming.id));
          if (exists) return prev;
          return [...prev, incoming];
        });
      }

      // Always update last message time for sorting (even if not current chat)
      const friendId = incoming.senderId === auth?.userId ? incoming.receiverId : incoming.senderId;
      setLastMessageTime(prev => ({ ...prev, [friendId]: incoming.createdAt }));
    };

    socket.on("receiveMessage", handler);
    return () => socket.off("receiveMessage", handler);
  }, [selectedUser, auth]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !selectedUser || !auth) return;

    try {
      const res = await fetch(`${API_BASE}/api/messages/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": auth.token,
        },
        body: JSON.stringify({
          receiverId: selectedUser.id,
          content: input,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const { messageId } = await res.json();

      const newMsg = {
        id: messageId,
        senderId: auth.userId,
        receiverId: selectedUser.id,
        content: input,
        createdAt: new Date().toISOString(),
      };

      socket.emit("sendMessage", newMsg);
      setInput("");

      // Update last message time immediately when sending
      setLastMessageTime(prev => ({ ...prev, [selectedUser.id]: newMsg.createdAt }));
    } catch (err) {
      console.error("Error sending message:", err.message);
    }
  };

  const renderProfileLogo = (user, size = 44) => {
    if (user?.profileImg) {
      return (
        <img
          src={`${API_BASE}${user.profileImg}`}
          alt={user.fullName}
          className="rounded-circle shadow-sm border border-3 border-white object-fit-cover"
          style={{ width: `${size}px`, height: `${size}px` }}
        />
      );
    }
    const initial = user?.fullName ? user.fullName.charAt(0).toUpperCase() : "?";
    return (
      <div
        className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          background: "linear-gradient(135deg, #667eea, #764ba2)",
          fontSize: `${size / 2.4}px`,
          border: "3px solid #fff",
        }}
      >
        {initial}
      </div>
    );
  };

  // FILTER + SORT: Recent chats at top
  const filteredAndSortedFriends = friends
    .filter((f) =>
      [f.fullName, f.email].filter(Boolean).some((val) =>
        val.toLowerCase().includes(search.toLowerCase())
      )
    )
    .sort((a, b) => {
      const timeA = lastMessageTime[a.id] || 0;
      const timeB = lastMessageTime[b.id] || 0;
      return new Date(timeB) - new Date(timeA); // Most recent first
    });

  const selectUser = (user) => {
    setSelectedUser(user);
    fetchMessages(user.id);
    setShowSidebar(false);
  };

  return (
    <div className="d-flex h-100vh" style={{ height: "100dvh", overflow: "hidden" }}>
      
      {/* Friends Sidebar */}
      <div
        className={`bg-white border-end d-flex flex-column ${showSidebar ? "d-block" : "d-none d-md-block"}`}
        style={{ width: "100%", maxWidth: "420px", minWidth: "320px" }}
      >
        <div className="p-4 border-bottom bg-primary text-white d-flex align-items-center justify-content-between">
          <h3 className="mb-0 fw-bold">Messages</h3>
          <button onClick={() => setShowSidebar(false)} className="btn btn-sm btn-outline-light d-md-none">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="p-3 border-bottom">
          <div className="position-relative">
            <input
              type="text"
              placeholder="Search friends..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control rounded-pill ps-5 shadow-sm"
              style={{ height: "50px", background: "#f1f3f4" }}
            />
            <i className="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
          </div>
        </div>

        <div className="flex-grow-1 overflow-y-auto px-2">
          {filteredAndSortedFriends.length > 0 ? (
            filteredAndSortedFriends.map((user) => (
              <div
                key={user.id}
                onClick={() => selectUser(user)}
                className={`d-flex align-items-center p-3 rounded-3 mx-2 my-2 cursor-pointer transition-all ${
                  selectedUser?.id === user.id ? "bg-primary text-white shadow-sm" : "hover-bg-light"
                }`}
              >
                <div className="me-3">
                  {renderProfileLogo(user, 50)}
                </div>
                <div className="flex-grow-1 text-truncate">
                  <h6 className={`mb-1 fw-semibold text-truncate ${selectedUser?.id === user.id ? "text-white" : "text-dark"}`}>
                    {user.fullName}
                  </h6>
                  <small className={selectedUser?.id === user.id ? "text-white opacity-75" : "text-muted"}>
                    {user.email}
                  </small>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted py-5">
              <i className="fas fa-users display-4 opacity-25"></i>
              <p className="mt-3">No friends found</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-grow-1 d-flex flex-column bg-light position-relative">
        {selectedUser ? (
          <>
            <div className="p-3 p-md-4 bg-white border-bottom shadow-sm d-flex align-items-center gap-3">
              <button onClick={() => setShowSidebar(true)} className="btn btn-lg d-md-none">
                <i className="fas fa-arrow-left"></i>
              </button>
              {renderProfileLogo(selectedUser, 56)}
              <div className="flex-grow-1">
                <h5 className="mb-0 fw-bold text-truncate">{selectedUser.fullName}</h5>
                <small className="text-success fw-medium">● Online</small>
              </div>
            </div>

            <div
              ref={chatContainerRef}
              className="flex-grow-1 overflow-y-auto px-3 px-md-5 py-4"
              style={{
                backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
                backgroundAttachment: "fixed",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {messages.length > 0 ? (
                messages.map((msg) => {
                  const isMine = Number(msg.senderId) === auth?.userId;
                  return (
                    <div
                      key={msg.id}
                      className={`d-flex align-items-end gap-2 mb-4 ${isMine ? "justify-content-end" : "justify-content-start"}`}
                    >
                      {!isMine && (
                        <div className="flex-shrink-0">
                          {renderProfileLogo(selectedUser, 38)}
                        </div>
                      )}

                      <div
                        className={`px-4 py-3 rounded-3 shadow-sm max-w-75 ${isMine ? "bg-primary text-white" : "bg-white"}`}
                        style={{
                          borderRadius: "18px",
                          borderBottomLeftRadius: isMine ? "18px" : "4px",
                          borderBottomRightRadius: isMine ? "4px" : "18px",
                        }}
                      >
                        <p className="mb-1 text-break">{msg.content}</p>
                        <small className={isMine ? "text-white opacity-75" : "text-muted"}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </small>
                      </div>

                      {isMine && (
                        <div className="flex-shrink-0">
                          {renderProfileLogo(loggedInUser || { fullName: "You" }, 38)}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-muted py-5">
                  <i className="fas fa-comment-dots display-1 opacity-10"></i>
                  <p className="lead mt-3">Start your conversation!</p>
                </div>
              )}
            </div>

            <div className="p-3 p-md-4 bg-white border-top">
              <div className="d-flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  className="form-control form-control-lg rounded-pill shadow-sm flex-grow-1"
                />
                <button
                  onClick={handleSend}
                  className="btn btn-primary btn-lg rounded-circle shadow-lg d-flex align-items-center justify-content-center"
                  style={{ width: "58px", height: "58px" }}
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted px-4">
            <button
              onClick={() => setShowSidebar(true)}
              className="btn btn-primary btn-lg rounded-circle mb-4 shadow-lg d-md-none"
              style={{ width: "70px", height: "70px" }}
            >
              <i className="fas fa-comment-dots fa-2x"></i>
            </button>
            <i className="fas fa-comment-slash display-1 mb-4 opacity-25 d-none d-md-block"></i>
            <h3 className="text-center">Select a friend to start chatting</h3>
            <p className="text-center mt-3 d-md-none">Tap the button to open friends list</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
import { useState, useEffect, useRef } from "react";
import { useChat } from "./hooks/useChat.js";
import { useUsers } from "./hooks/useUsers.js";
import { ChatInput } from "./components/ChatInput.js";
import { MessageBubble } from "./components/MessageBubble.js";
import { TypingIndicator } from "./components/TypingIndicator.js";
import { ConversationList } from "./components/ConversationList.js";

function App() {
  // Fetch users dynamically from the backend
  const { users, isLoading: usersLoading, error: usersError } = useUsers();

  const [userId, setUserId] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Set default user when users are loaded
  useEffect(() => {
    if (users.length > 0 && !userId) {
      setUserId(users[0].id);
    }
  }, [users, userId]);

  const {
    messages,
    isLoading,
    isTyping,
    typingStatus,
    error,
    conversationId,
    sendMessage,
    loadConversation,
    startNewConversation,
  } = useChat(userId);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Refresh conversation list when a message is sent
  useEffect(() => {
    if (conversationId) {
      setRefreshKey((k) => k + 1);
    }
  }, [conversationId]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      {sidebarOpen && (
        <aside className="w-72 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-lg font-bold text-gray-900">
              Swadesh AI Chat
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Multi-Agent Customer Support
            </p>
          </div>
          <ConversationList
            userId={userId}
            activeId={conversationId}
            onSelect={loadConversation}
            onNew={startNewConversation}
            refreshKey={refreshKey}
          />
          {/* User ID input for demo */}
          <div className="p-3 border-t border-gray-200 space-y-2">
            <label className="text-xs font-medium text-gray-500 block">
              Switch User (demo)
            </label>
            {usersLoading ? (
              <div className="text-xs text-gray-400">Loading users...</div>
            ) : usersError ? (
              <div className="text-xs text-red-500">{usersError}</div>
            ) : (
              <select
                value={userId}
                onChange={(e) => {
                  setUserId(e.target.value);
                  startNewConversation();
                }}
                className="w-full text-xs rounded border border-gray-300 px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            )}
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full text-[10px] font-mono rounded border border-gray-300 px-2 py-1.5 text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Or paste UUID manually"
            />
          </div>
        </aside>
      )}

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              {conversationId ? "Conversation" : "New Chat"}
            </h2>
            {conversationId && (
              <p className="text-xs text-gray-400 font-mono">
                {conversationId.slice(0, 8)}...
              </p>
            )}
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-3xl mx-auto">
            {messages.length === 0 && !isLoading && (
              <div className="text-center py-20">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  How can I help you today?
                </h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  Ask me about your orders, billing, refunds, or any general
                  support questions. I'll route you to the right specialist.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {[
                    "Where is my order?",
                    "I need a refund",
                    "Show my invoices",
                    "Help with my account",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => sendMessage(suggestion)}
                      className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-full
                        text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {isTyping && <TypingIndicator status={typingStatus} />}

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <ChatInput onSend={sendMessage} disabled={isLoading} />
      </main>
    </div>
  );
}

export default App;

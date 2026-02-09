import { Hono } from "hono";
import { chatController } from "../controllers/chat.controller.js";

/**
 * Chat routes — typed for Hono RPC.
 * Route chain is preserved for type inference.
 */
const chatRoutes = new Hono()
  // POST /api/chat/messages — Send new message (SSE stream response)
  .post("/messages", chatController.sendMessage)

  // GET /api/chat/conversations/:id — Get conversation history
  .get("/conversations/:id", chatController.getConversation)

  // GET /api/chat/conversations — List user conversations
  .get("/conversations", chatController.listConversations)

  // DELETE /api/chat/conversations/:id — Delete conversation
  .delete("/conversations/:id", chatController.deleteConversation);

export { chatRoutes };

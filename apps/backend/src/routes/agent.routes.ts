import { Hono } from "hono";
import { agentController } from "../controllers/agent.controller.js";

/**
 * Agent routes — typed for Hono RPC.
 */
const agentRoutes = new Hono()
  // GET /api/agents — List all agents
  .get("/", agentController.listAgents)

  // GET /api/agents/:type/capabilities — Get agent capabilities
  .get("/:type/capabilities", agentController.getCapabilities);

export { agentRoutes };

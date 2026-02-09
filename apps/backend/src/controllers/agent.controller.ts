import { Context } from "hono";
import { agentService } from "../services/agent.service.js";
import { ValidationError } from "../middleware/error-handler.js";

/**
 * Agent Controller
 *
 * Handles agent registry and capabilities endpoints.
 */
export const agentController = {
  /**
   * GET /api/agents
   * List all available agents.
   */
  async listAgents(c: Context) {
    const agents = await agentService.listAgents();
    return c.json({ data: agents });
  },

  /**
   * GET /api/agents/:type/capabilities
   * Get capabilities for a specific agent type.
   */
  async getCapabilities(c: Context) {
    const type = c.req.param("type");

    const validTypes = ["router", "support", "order", "billing"];
    if (!validTypes.includes(type)) {
      throw new ValidationError(
        `Invalid agent type '${type}'. Must be one of: ${validTypes.join(", ")}`
      );
    }

    const capabilities = await agentService.getCapabilities(type as any);
    return c.json({ data: capabilities });
  },
};

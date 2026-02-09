import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { agents, agentCapabilities } from "../db/schema.js";
import { NotFoundError } from "../middleware/error-handler.js";

export const agentService = {
  /**
   * List all registered agents.
   */
  async listAgents() {
    return db.query.agents.findMany({
      with: {
        capabilities: true,
      },
    });
  },

  /**
   * Get agent by type with its capabilities.
   */
  async getByType(type: "router" | "support" | "order" | "billing") {
    const agent = await db.query.agents.findFirst({
      where: eq(agents.type, type),
      with: {
        capabilities: true,
      },
    });

    if (!agent) {
      throw new NotFoundError("Agent", type);
    }

    return agent;
  },

  /**
   * Get capabilities for a specific agent type.
   */
  async getCapabilities(agentType: "router" | "support" | "order" | "billing") {
    return db.query.agentCapabilities.findMany({
      where: eq(agentCapabilities.agentType, agentType),
    });
  },
};

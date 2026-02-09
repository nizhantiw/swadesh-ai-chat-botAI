import { Hono } from "hono";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";

/**
 * User routes — fetch users for demo user selector.
 */
const userRoutes = new Hono()
    // GET /api/users — List all users
    .get("/", async (c) => {
        const allUsers = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
            })
            .from(users);

        return c.json({ data: allUsers });
    });

export { userRoutes };

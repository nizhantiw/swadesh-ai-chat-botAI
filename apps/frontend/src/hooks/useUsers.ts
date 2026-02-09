import { useState, useEffect } from "react";

export interface User {
    id: string;
    name: string;
    email: string;
}

const API_BASE = "/api";

/**
 * Hook to fetch and manage users from the backend.
 * Automatically loads users on mount.
 */
export function useUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const response = await fetch(`${API_BASE}/users`);

                if (!response.ok) {
                    throw new Error("Failed to fetch users");
                }

                const data = await response.json();
                setUsers(data.data || []);
            } catch (err) {
                console.error("Error fetching users:", err);
                setError(err instanceof Error ? err.message : "Failed to fetch users");
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, []);

    return { users, isLoading, error };
}

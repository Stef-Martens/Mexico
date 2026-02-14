"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

interface UserWithMembership {
  user_id: string;
  email: string;
  is_member: boolean;
  is_admin: boolean;
  created_at: string;
}

interface AdminClientProps {
  users: UserWithMembership[];
}

export function AdminClient({ users: initialUsers }: AdminClientProps) {
  const [users, setUsers] = useState(initialUsers);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/add-member", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add member");
      }

      setMessage({
        text: `Successfully added ${email} as a member!`,
        type: "success",
      });
      setEmail("");

      // Refresh the page to show updated list
      window.location.reload();
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Failed to add member",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const nonMembers = users.filter((u) => !u.is_member);
  const members = users.filter((u) => u.is_member);

  return (
    <div className="space-y-8">
      {/* Add Member Form */}
      <div className="bg-card rounded-lg p-6 border">
        <h2 className="text-xl font-semibold mb-4">Add New Member</h2>
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              className="w-full px-3 py-2 border rounded-md"
              disabled={loading}
            />
          </div>
          {message && (
            <div
              className={`p-3 rounded-md text-sm ${
                message.type === "success"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              }`}
            >
              {message.text}
            </div>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add Member"}
          </Button>
        </form>
      </div>

      {/* Non-Members List */}
      {nonMembers.length > 0 && (
        <div className="bg-card rounded-lg p-6 border">
          <h2 className="text-xl font-semibold mb-4">
            Registered Users (Not Members) - {nonMembers.length}
          </h2>
          <div className="space-y-2">
            {nonMembers.map((user) => (
              <div
                key={user.user_id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div>
                  <div className="font-medium">{user.email}</div>
                  <div className="text-sm text-muted-foreground">
                    Registered: {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="bg-card rounded-lg p-6 border">
        <h2 className="text-xl font-semibold mb-4">
          Current Members - {members.length}
        </h2>
        <div className="space-y-2">
          {members.map((user) => (
            <div
              key={user.user_id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{user.email}</span>
                  {user.is_admin && (
                    <span className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded-full">
                      Admin
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Member since: {new Date(user.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

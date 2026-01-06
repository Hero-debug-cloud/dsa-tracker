"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAttempts } from "@/lib/hooks";
import { AddAttemptModal } from "@/components/AddAttemptModal";
import { Plus } from "lucide-react";
import { ArrowInlineLoader } from "@/components/ui/ArrowLoader";

// Wrapper component for search params functionality
function AttemptsPageContent() {
  const [users, setUsers] = useState<
    { id: number; name: string; created_at: string }[]
  >([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [defaultProblemId, setDefaultProblemId] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  const { attempts, loading, loadAttempts } = useAttempts();

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/login");
    } else {
      loadUsers();
    }
  }, [router]);

  // Check for pre-filled parameters from problems page
  useEffect(() => {
    const problemId = searchParams.get("problemId");
    const user = searchParams.get("user");

    if (problemId) {
      setDefaultProblemId(problemId);
    }

    if (user) {
      setSelectedUser(user);
    }
  }, [searchParams]);

  // Auto-load attempts when user is selected
  useEffect(() => {
    if (selectedUser) {
      loadAttempts(selectedUser);
    }
  }, [selectedUser, loadAttempts]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await fetch("/api/users", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to load users");
      }
      const userData = await response.json();
      setUsers(userData);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case "solved":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "revisit":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "unsolved":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  return (
    <div className="container mx-auto py-6 sm:py-10 px-4 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attempts</h1>
          <p className="text-muted-foreground mt-1">
            Track your problem-solving attempts.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Attempt
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b mb-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <CardTitle>History</CardTitle>
            <div className="w-full sm:w-[250px]">
              <Select
                value={selectedUser}
                onValueChange={setSelectedUser}
                disabled={usersLoading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      usersLoading
                        ? "Loading users..."
                        : "Select user to view attempts"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.name}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile view - Card layout for small screens */}
          <div className="block md:hidden">
            {loading ? (
              <div className="p-8 text-center">
                <ArrowInlineLoader text="Loading attempts..." />
              </div>
            ) : attempts.length > 0 ? (
              attempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="border rounded-lg p-4 mb-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          #{attempt.id}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusClass(attempt.status)}`}
                        >
                          {attempt.status}
                        </span>
                      </div>
                      <h3 className="font-medium truncate">{attempt.problem_name || attempt.problem_id}</h3>
                      <div className="mt-2 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date:</span>
                          <span>{attempt.date}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Time:</span>
                          <span>{attempt.time_taken || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">First Try:</span>
                          <span>{attempt.first_try ? "Yes" : "No"}</span>
                        </div>
                        {attempt.notes && (
                          <div>
                            <span className="text-muted-foreground block">Notes:</span>
                            <span className="text-sm">{attempt.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                {selectedUser
                  ? "No attempts found for this user."
                  : "Select a user to view attempts."}
              </div>
            )}
          </div>

          {/* Desktop view - Table layout */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Problem</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time (min)</TableHead>
                  <TableHead>First Try</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <ArrowInlineLoader text="Loading attempts..." />
                    </TableCell>
                  </TableRow>
                ) : attempts.length > 0 ? (
                  attempts.map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell>{attempt.id}</TableCell>
                      <TableCell className="font-medium">
                        {attempt.problem_name || attempt.problem_id}
                      </TableCell>
                      <TableCell>{attempt.date}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(attempt.status)}`}
                        >
                          {attempt.status}
                        </span>
                      </TableCell>
                      <TableCell>{attempt.time_taken || "-"}</TableCell>
                      <TableCell>{attempt.first_try ? "Yes" : "No"}</TableCell>
                      <TableCell
                        className="max-w-[200px] truncate"
                        title={attempt.notes}
                      >
                        {attempt.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground py-12"
                    >
                      {selectedUser
                        ? "No attempts found for this user."
                        : "Select a user to view attempts."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AddAttemptModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        users={users}
        defaultUser={selectedUser}
        defaultProblemId={defaultProblemId}
        onSuccess={() => {
          if (selectedUser) {
            loadAttempts(selectedUser);
          }
        }}
      />
    </div>
  );
}

export default function AttemptsPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto py-10 px-4 max-w-6xl">Loading...</div>
      }
    >
      <AttemptsPageContent />
    </Suspense>
  );
}

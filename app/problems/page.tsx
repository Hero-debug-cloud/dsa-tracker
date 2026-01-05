"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Search, ExternalLink, Plus } from "lucide-react";
import { useProblems, useMinimumLoadingTime } from "@/lib/hooks";
import { AddAttemptModal } from "@/components/AddAttemptModal";
import { DSAInlineLoader } from "@/components/ui/DSALoader";
import { ArrowInlineLoader } from "@/components/ui/ArrowLoader";

export default function ProblemsPage() {
  const [users, setUsers] = useState<
    { id: number; name: string; created_at: string }[]
  >([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isAddProblemModalOpen, setIsAddProblemModalOpen] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<string>("");

  // State for Add Attempt Modal
  const [isAddAttemptModalOpen, setIsAddAttemptModalOpen] = useState(false);
  const [attemptProblemId, setAttemptProblemId] = useState<string>("");

  const [newProblem, setNewProblem] = useState({
    platform: "",
    name: "",
    link: "",
    topic: "",
    difficulty: "Easy",
  });

  const router = useRouter();

  const { problems, loading, error, loadProblems, addProblem } = useProblems();

  // Ensure loader shows for minimum 2 seconds
  const showFullScreenLoader = useMinimumLoadingTime(
    loading && problems.length === 0,
    2000,
  );
  const showInlineLoader = useMinimumLoadingTime(
    loading && problems.length > 0,
    1500,
  );

  // Check authentication and get logged-in user
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/login");
    } else {
      loadUsers();

      // Get logged in user info
      const userStr = localStorage.getItem("currentUser");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user?.name) {
            setLoggedInUser(user.name);
          }
        } catch (e) {
          console.error("Error parsing user data:", e);
        }
      }
    }
  }, [router]);

  // Load problems when selected user changes or on initial load
  useEffect(() => {
    loadProblems(selectedUser);
  }, [selectedUser]);

  const loadUsers = async () => {
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
    }
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const openAddAttemptModal = (problemId: number) => {
    setAttemptProblemId(problemId.toString());
    setIsAddAttemptModalOpen(true);
  };

  const getDifficultyClass = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "hard":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
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

  const handleAddProblem = async () => {
    if (!newProblem.platform || !newProblem.name || !newProblem.topic) {
      toast.error("Please fill in all required fields (Platform, Name, Topic)");
      return;
    }

    const success = await addProblem(newProblem);
    if (success) {
      setIsAddProblemModalOpen(false);
      setNewProblem({
        platform: "",
        name: "",
        link: "",
        topic: "",
        difficulty: "Easy",
      });
    }
  };

  // Show full screen loader while initial data is loading
  if (showFullScreenLoader) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-6xl">
        <Card className="mb-8">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ArrowInlineLoader text="Loading problems database..." />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <Card className="mb-8">
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="mb-4">
              <h2 className="text-2xl font-bold tracking-tight">Problems</h2>
              <p className="text-muted-foreground">
                Manage and track your DSA collection.
              </p>
            </div>
            <Dialog
              open={isAddProblemModalOpen}
              onOpenChange={setIsAddProblemModalOpen}
            >
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Problem
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Problem</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="platform" className="text-right">
                      Platform
                    </Label>
                    <Input
                      id="platform"
                      className="col-span-3"
                      value={newProblem.platform}
                      onChange={(e) =>
                        setNewProblem({
                          ...newProblem,
                          platform: e.target.value,
                        })
                      }
                      placeholder="e.g. LeetCode"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      className="col-span-3"
                      value={newProblem.name}
                      onChange={(e) =>
                        setNewProblem({ ...newProblem, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="link" className="text-right">
                      Link
                    </Label>
                    <Input
                      id="link"
                      className="col-span-3"
                      value={newProblem.link}
                      onChange={(e) =>
                        setNewProblem({ ...newProblem, link: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="topic" className="text-right">
                      Topic
                    </Label>
                    <Input
                      id="topic"
                      className="col-span-3"
                      value={newProblem.topic}
                      onChange={(e) =>
                        setNewProblem({ ...newProblem, topic: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="difficulty" className="text-right">
                      Difficulty
                    </Label>
                    <Select
                      value={newProblem.difficulty}
                      onValueChange={(value) =>
                        setNewProblem({ ...newProblem, difficulty: value })
                      }
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Easy">Easy</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleAddProblem}>Add Problem</Button>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search problems by name, topic or platform..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-[150px]">
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by User" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.name}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-[150px]">
              <Select
                value={selectedDifficulty}
                onValueChange={setSelectedDifficulty}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulties</SelectItem>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-[150px]">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Solved">Solved</SelectItem>
                  <SelectItem value="Unsolved">Unsolved</SelectItem>
                  <SelectItem value="Revisit">Revisit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border bg-card shadow-sm overflow-hidden mt-6">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="w-[60px] h-12 px-4 text-left font-semibold text-muted-foreground">
                    ID
                  </th>
                  <th className="h-12 px-4 text-left font-semibold text-muted-foreground">
                    Platform
                  </th>
                  <th className="h-12 px-4 text-left font-semibold text-muted-foreground">
                    Name
                  </th>
                  <th className="h-12 px-4 text-left font-semibold text-muted-foreground">
                    Topic
                  </th>
                  <th className="h-12 px-4 text-left font-semibold text-muted-foreground">
                    Difficulty
                  </th>
                  <th className="h-12 px-4 text-left font-semibold text-muted-foreground">
                    Status
                  </th>
                  <th className="h-12 px-4 text-left font-semibold text-muted-foreground">
                    Solved By
                  </th>
                  <th className="h-12 px-4 text-right font-semibold text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="w-full">
                {showInlineLoader ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8">
                      <ArrowInlineLoader text="Refreshing problems..." />
                    </td>
                  </tr>
                ) : problems.length > 0 ? (
                  problems
                    .filter((problem) => {
                      // Search filter
                      const matchesSearch =
                        !searchTerm ||
                        problem.name
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase()) ||
                        problem.platform
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase()) ||
                        problem.topic
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase());

                      // Difficulty filter
                      const matchesDifficulty =
                        selectedDifficulty === "all" ||
                        problem.difficulty.toLowerCase() ===
                          selectedDifficulty.toLowerCase();

                      // Status filter
                      const matchesStatus =
                        selectedStatus === "all" ||
                        (problem.status &&
                          problem.status.toLowerCase() ===
                            selectedStatus.toLowerCase());

                      return (
                        matchesSearch && matchesDifficulty && matchesStatus
                      );
                    })
                    .map((problem) => (
                      <tr
                        key={problem.id}
                        className="hover:bg-muted/50 transition-colors border-b"
                      >
                        <td className="p-4 font-mono text-xs text-muted-foreground">
                          #{problem.id}
                        </td>
                        <td className="p-4 font-medium text-muted-foreground">
                          {problem.platform.charAt(0).toUpperCase() +
                            problem.platform.slice(1).toLowerCase()}
                        </td>
                        <td className="p-4 font-medium">{problem.name}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                            {problem.topic}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ${getDifficultyClass(problem.difficulty)}`}
                          >
                            {problem.difficulty}
                          </span>
                        </td>
                        <td className="p-4">
                          {problem.status ? (
                            <span
                              className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ${getStatusClass(problem.status)}`}
                            >
                              {problem.status}
                            </span>
                          ) : (
                            <span className="text-muted-foreground opacity-50">
                              -
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          {problem.solved_by_users ? (
                            <div className="flex -space-x-2 overflow-hidden">
                              {problem.solved_by_users
                                .split(",")
                                .map((u) => u.trim())
                                .filter(Boolean)
                                .map((u, i) => (
                                  <div
                                    key={i}
                                    className="inline-flex items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground h-6 w-6 ring-2 ring-background"
                                    title={u}
                                  >
                                    {u.charAt(0).toUpperCase()}
                                  </div>
                                ))}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1">
                            {problem.link && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                onClick={() =>
                                  window.open(problem.link, "_blank")
                                }
                                title="Browse Problem"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => openAddAttemptModal(problem.id)}
                              title="Add Attempt"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center text-muted-foreground py-12"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Search className="h-8 w-8 opacity-20" />
                        <p>No problems found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AddAttemptModal
        open={isAddAttemptModalOpen}
        onOpenChange={setIsAddAttemptModalOpen}
        users={users}
        defaultUser={
          selectedUser && selectedUser !== "all" ? selectedUser : loggedInUser
        }
        defaultProblemId={attemptProblemId}
        onSuccess={() => loadProblems(selectedUser)}
      />
    </div>
  );
}

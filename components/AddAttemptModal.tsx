"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAttempts } from "@/lib/hooks";
import { toast } from "sonner";

interface AddAttemptModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    users: { id: number; name: string }[];
    defaultUser?: string;
    defaultProblemId?: string;
    onSuccess?: () => void;
}

export function AddAttemptModal({
    open,
    onOpenChange,
    users,
    defaultUser = "",
    defaultProblemId = "",
    onSuccess
}: AddAttemptModalProps) {
    const [attemptUser, setAttemptUser] = useState<string>(defaultUser);
    const [attemptProblemId, setAttemptProblemId] = useState<string>(defaultProblemId);
    const [attemptDate, setAttemptDate] = useState<string>("");
    const [attemptStatus, setAttemptStatus] = useState<string>("Solved");
    const [attemptTime, setAttemptTime] = useState<string>("");
    const [attemptFirstTry, setAttemptFirstTry] = useState<string>("1");
    const [attemptNotes, setAttemptNotes] = useState<string>("");

    const { addAttempt } = useAttempts();

    useEffect(() => {
        if (open) {
            // Reset or initialize form when modal opens
            setAttemptUser(defaultUser);
            setAttemptProblemId(defaultProblemId);
            if (!attemptDate) {
                setAttemptDate(new Date().toISOString().split('T')[0]);
            }
        }
    }, [open, defaultUser, defaultProblemId]);

    const handleAddAttempt = async () => {
        if (!attemptUser || !attemptProblemId || !attemptDate) {
            toast.error("Please fill in all required fields (User, Problem ID, Date)");
            return;
        }

        const attemptData = {
            user: attemptUser,
            problem_id: parseInt(attemptProblemId),
            date: attemptDate,
            status: attemptStatus,
            time_taken: attemptTime ? parseInt(attemptTime) : undefined,
            first_try: parseInt(attemptFirstTry),
            notes: attemptNotes
        };

        const success = await addAttempt(attemptData);
        if (success) {
            toast.success("Attempt added successfully");
            // Clear form (optional depending on UX, but good for next time)
            setAttemptTime("");
            setAttemptNotes("");

            if (onSuccess) {
                onSuccess();
            }
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Add Attempt</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="attempt-user">User</Label>
                            <Select value={attemptUser} onValueChange={setAttemptUser}>
                                <SelectTrigger id="attempt-user">
                                    <SelectValue placeholder="Select user" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.map(user => (
                                        <SelectItem key={user.id} value={user.name}>{user.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="problem-id">Problem ID</Label>
                            <Input
                                id="problem-id"
                                type="number"
                                value={attemptProblemId}
                                onChange={(e) => setAttemptProblemId(e.target.value)}
                                placeholder="Enter problem ID"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="attempt-date">Date</Label>
                            <Input
                                id="attempt-date"
                                type="date"
                                value={attemptDate}
                                onChange={(e) => setAttemptDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select value={attemptStatus} onValueChange={setAttemptStatus}>
                                <SelectTrigger id="status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Solved">Solved</SelectItem>
                                    <SelectItem value="Revisit">Revisit</SelectItem>
                                    <SelectItem value="Unsolved">Unsolved</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="time-taken">Time (min)</Label>
                            <Input
                                id="time-taken"
                                type="number"
                                value={attemptTime}
                                onChange={(e) => setAttemptTime(e.target.value)}
                                placeholder="Time taken"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="first-try">First Try</Label>
                            <Select value={attemptFirstTry} onValueChange={setAttemptFirstTry}>
                                <SelectTrigger id="first-try">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Yes</SelectItem>
                                    <SelectItem value="0">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={attemptNotes}
                                onChange={(e) => setAttemptNotes(e.target.value)}
                                placeholder="Additional notes"
                                className="min-h-[100px]"
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleAddAttempt}>Add Attempt</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

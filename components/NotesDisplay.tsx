import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MessageSquare, Copy } from "lucide-react";
import React from "react";
import { toast } from "sonner";

interface NotesDisplayProps {
  notes?: string;
}

export function NotesDisplay({ notes }: NotesDisplayProps) {
  if (!notes || notes.trim() === "") {
    return <span className="text-muted-foreground">-</span>;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(notes);
    toast.success("Notes copied to clipboard!");
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-transparent hover:text-primary"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="sr-only">View notes</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 max-h-60 overflow-y-auto p-4">
        <div className="whitespace-pre-wrap break-words">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium">Notes</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-7 w-7 p-0"
            >
              <Copy className="h-3.5 w-3.5" />
              <span className="sr-only">Copy notes</span>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">{notes}</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
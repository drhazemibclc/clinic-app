import { cn } from "@clinic-app/ui/lib/utils";
import { Loader2 } from "lucide-react";

export default function Loader({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Loader2 className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

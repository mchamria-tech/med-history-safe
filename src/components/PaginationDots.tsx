import { cn } from "@/lib/utils";

interface PaginationDotsProps {
  total: number;
  current: number;
  className?: string;
}

const PaginationDots = ({ total, current, className }: PaginationDotsProps) => {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {Array.from({ length: total }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "h-3 w-3 rounded-full transition-colors duration-300",
            index === current
              ? "bg-primary"
              : "bg-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
};

export default PaginationDots;

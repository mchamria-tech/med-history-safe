import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTheme } from "@/contexts/ThemeContext";
import { themes } from "@/lib/themes";
import { cn } from "@/lib/utils";

export const ThemeSelector = () => {
  const { currentTheme, setTheme } = useTheme();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10"
          aria-label="Select theme"
        >
          <Palette className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Choose Theme</h3>
          <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setTheme(theme.id)}
                className={cn(
                  "relative p-3 rounded-lg border-2 transition-all hover:scale-105",
                  currentTheme === theme.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="space-y-2">
                  <div className="flex gap-1.5 h-8">
                    <div
                      className="flex-1 rounded"
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                    <div
                      className="flex-1 rounded"
                      style={{ backgroundColor: theme.colors.accent }}
                    />
                    <div
                      className="flex-1 rounded border"
                      style={{ backgroundColor: theme.colors.background }}
                    />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-xs">{theme.name}</div>
                    <div className="text-[10px] text-muted-foreground line-clamp-2">
                      {theme.description}
                    </div>
                  </div>
                </div>
                {currentTheme === theme.id && (
                  <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

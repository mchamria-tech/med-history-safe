import { Search, Bell, Calendar, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DashboardHeaderProps {
  partnerName: string;
  userName: string;
  onSearchClick: () => void;
  onNewClientClick: () => void;
  logoUrl?: string | null;
}

export const DashboardHeader = ({ 
  partnerName, 
  userName,
  onSearchClick,
  onNewClientClick,
  logoUrl
}: DashboardHeaderProps) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      {/* Search Bar */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search client or record..."
          className="pl-10 bg-card border-border/50 h-11 rounded-xl cursor-pointer"
          onClick={onSearchClick}
          readOnly
        />
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-3">
        {/* Search Client Button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onSearchClick}
          className="hidden sm:flex h-10 rounded-xl"
        >
          <Search className="h-4 w-4 mr-2" />
          Search Client
        </Button>
        
        {/* New Client Button */}
        <Button 
          size="sm" 
          onClick={onNewClientClick}
          className="bg-accent hover:bg-accent/90 text-accent-foreground h-10 rounded-xl"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">New Client</span>
        </Button>

        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-muted">
          <Bell className="h-5 w-5 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-muted">
          <Calendar className="h-5 w-5 text-muted-foreground" />
        </Button>
        
        {/* Partner Info */}
        <div className="flex items-center gap-3 pl-3 border-l border-border">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-foreground">{partnerName}</p>
            <p className="text-xs text-muted-foreground">{userName}</p>
          </div>
          <Avatar className="h-10 w-10 border-2 border-accent/20">
            {logoUrl && <AvatarImage src={logoUrl} alt={partnerName} />}
            <AvatarFallback className="bg-accent/10 text-accent font-semibold text-sm">
              {getInitials(partnerName)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
};

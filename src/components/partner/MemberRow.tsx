import { Heart, MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "./StatusBadge";
import { RiskLevelBar } from "./RiskLevelBar";
import { MockMember } from "./mockData";

interface MemberRowProps {
  member: MockMember;
  onViewAnalytics?: (memberId: string) => void;
  onUploadDocuments?: (memberId: string) => void;
  onUnlink?: (memberId: string) => void;
}

export const MemberRow = ({
  member,
  onViewAnalytics,
  onUploadDocuments,
  onUnlink,
}: MemberRowProps) => {
  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-foreground">{member.name}</p>
            <p className="text-sm text-muted-foreground">
              {member.age} yrs • {member.memberId}
            </p>
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <StatusBadge status={member.status} />
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-red-500 fill-red-500" />
          <span className="font-medium">{member.heartRate}</span>
          <span className="text-sm text-muted-foreground">BPM</span>
        </div>
      </td>
      <td className="py-4 px-4 min-w-[200px]">
        <RiskLevelBar
          level={member.riskLevel}
          percentage={member.riskPercentage}
        />
      </td>
      <td className="py-4 px-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewAnalytics?.(member.id)}>
              View Analytics
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUploadDocuments?.(member.id)}>
              Upload Documents
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onUnlink?.(member.id)}
              className="text-destructive"
            >
              Unlink Member
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
};

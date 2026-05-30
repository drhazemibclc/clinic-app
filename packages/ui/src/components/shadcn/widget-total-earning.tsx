import { Avatar, AvatarFallback } from "@clinic-app/ui/components/avatar";
import { Button } from "@clinic-app/ui/components/button";
import { Card, CardContent, CardHeader } from "@clinic-app/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@clinic-app/ui/components/dropdown-menu";
import { Progress } from "@clinic-app/ui/components/progress";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  EllipsisVerticalIcon,
} from "lucide-react";

const listItems = ["Share", "Update", "Refresh"];

type Props = {
  title: string;
  earning: number;
  trend: "up" | "down";
  percentage: number;
  comparisonText: string;
  earningData: {
    img: string;
    platform: string;
    technologies: string;
    earnings: string;
    progressPercentage: number;
  }[];
  className?: string;
};

const TotalEarningCard = ({
  earningData,
  title,
  earning,
  trend,
  percentage,
  comparisonText,
  className,
}: Props) => {
  return (
    <Card className={className}>
      <CardHeader className="flex items-center justify-between">
        <span className="font-semibold text-lg">{title}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="size-6 rounded-full text-muted-foreground"
              size="icon"
              variant="ghost"
            >
              <EllipsisVerticalIcon />
              <span className="sr-only">Menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              {listItems.map((item, index) => (
                <DropdownMenuItem key={index}>{item}</DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-2xl">${earning}</span>
            <span className="flex items-center gap-1">
              {trend === "up" ? (
                <ChevronUpIcon className="size-4" />
              ) : (
                <ChevronDownIcon className="size-4" />
              )}
              <span className="text-sm">{percentage}%</span>
            </span>
          </div>
          <span className="text-muted-foreground text-sm">
            {comparisonText}
          </span>
        </div>
        <div className="flex flex-1 flex-col justify-evenly gap-4">
          {earningData.map((earning, index) => (
            <div
              className="flex items-center justify-between gap-2.5"
              key={index}
            >
              <div className="flex items-center justify-between gap-2.5">
                <Avatar className="size-11 rounded-sm">
                  <AvatarFallback className="shrink-0 rounded-sm bg-primary/10">
                    <img
                      alt={earning.platform}
                      className="size-6"
                      src={earning.img}
                    />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{earning.platform}</span>
                  <span className="text-muted-foreground text-sm">
                    {earning.technologies}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm">{earning.earnings}</p>
                <Progress className="w-36" value={earning.progressPercentage} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TotalEarningCard;

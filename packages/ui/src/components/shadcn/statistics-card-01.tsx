import { Card, CardContent, CardHeader } from "@clinic-app/ui/components/card";
import { cn } from "@clinic-app/ui/lib/utils";
import type { ReactNode } from "react";

// Statistics card data type
type StatisticsCardProps = {
  icon: ReactNode;
  value: string;
  title: string;
  changePercentage: string;
  className?: string;
};

const StatisticsCard = ({
  icon,
  value,
  title,
  changePercentage,
  className,
}: StatisticsCardProps) => {
  return (
    <Card className={cn("gap-4", className)}>
      <CardHeader className="flex items-center">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </div>
        <span className="text-2xl">{value}</span>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <span className="font-semibold">{title}</span>
        <p className="space-x-2 rtl:space-x-reverse">
          <span className="text-sm">{changePercentage}</span>
          <span className="text-muted-foreground text-sm">than last week</span>
        </p>
      </CardContent>
    </Card>
  );
};

export default StatisticsCard;

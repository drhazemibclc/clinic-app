import { InfoButton } from "@clinic-app/ui/components/info-button";
import type { InfobarContent } from "@clinic-app/ui/components/infobar";

interface HeadingProps {
  description: string;
  infoContent?: InfobarContent;
  title: string;
}

export function Heading({ title, description, infoContent }: HeadingProps) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <h2 className="font-bold text-3xl tracking-tight">{title}</h2>
        {infoContent && (
          <div className="pt-1">
            <InfoButton content={infoContent} />
          </div>
        )}
      </div>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

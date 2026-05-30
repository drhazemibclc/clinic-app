import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@clinic-app/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@clinic-app/ui/components/dropdown-menu";
import {
  CirclePlusIcon,
  CreditCardIcon,
  LogOutIcon,
  SettingsIcon,
  SquarePenIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  trigger: ReactNode;
  defaultOpen?: boolean;
  align?: "start" | "center" | "end";
};

const ProfileDropdown = ({ trigger, defaultOpen, align = "end" }: Props) => {
  return (
    <DropdownMenu defaultOpen={defaultOpen}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={align || "end"} className="w-80">
        <DropdownMenuLabel className="flex items-center gap-4 px-4 py-2.5 font-normal">
          <div className="relative">
            <Avatar className="size-10">
              <AvatarImage
                alt="John Doe"
                src="https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-1.png"
              />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <span className="absolute inset-e-0 bottom-0 block size-2 rounded-full bg-green-600 ring-2 ring-card" />
          </div>
          <div className="flex flex-1 flex-col items-start">
            <span className="font-semibold text-foreground text-lg">
              John Doe
            </span>
            <span className="text-base text-muted-foreground">
              john.doe@example.com
            </span>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem className="px-4 py-2.5 text-base">
            <UserIcon className="size-5 text-foreground" />
            <span>My account</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="px-4 py-2.5 text-base">
            <SettingsIcon className="size-5 text-foreground" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="px-4 py-2.5 text-base">
            <CreditCardIcon className="size-5 text-foreground" />
            <span>Billing</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem className="px-4 py-2.5 text-base">
            <UsersIcon className="size-5 text-foreground" />
            <span>Manage team</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="px-4 py-2.5 text-base">
            <SquarePenIcon className="size-5 text-foreground" />
            <span>Customization</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="px-4 py-2.5 text-base">
            <CirclePlusIcon className="size-5 text-foreground" />
            <span>Add team account</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="px-4 py-2.5 text-base"
          variant="destructive"
        >
          <LogOutIcon className="size-5" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileDropdown;

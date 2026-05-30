"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@clinic-app/ui/components/dropdown-menu";
import type { ReactNode } from "react";
import { useState } from "react";

type Props = {
  trigger: ReactNode;
  defaultOpen?: boolean;
  align?: "start" | "center" | "end";
};

const LanguageDropdown = ({ defaultOpen, align, trigger }: Props) => {
  const [language, setLanguage] = useState("english");

  return (
    <DropdownMenu defaultOpen={defaultOpen}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={align || "end"} className="w-50">
        <DropdownMenuRadioGroup onValueChange={setLanguage} value={language}>
          <DropdownMenuRadioItem
            className="ps-2 text-base data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground [&>span]:hidden"
            value="english"
          >
            English
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            className="ps-2 text-base data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground [&>span]:hidden"
            value="german"
          >
            Deutsch
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            className="ps-2 text-base data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground [&>span]:hidden"
            value="spanish"
          >
            Española
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            className="ps-2 text-base data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground [&>span]:hidden"
            value="portuguese"
          >
            Português
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            className="ps-2 text-base data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground [&>span]:hidden"
            value="korean"
          >
            한국인
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageDropdown;

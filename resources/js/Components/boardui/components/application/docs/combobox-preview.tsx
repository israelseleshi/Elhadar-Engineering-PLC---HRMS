"use client";

import { RiCheckLine, RiSearchLine } from "@remixicon/react";
import { Avatar } from "@/Components/boardui/components/base/avatar/avatar";
import { MENU_ITEM, MENU_ITEM_ACTIVE, MENU_POPOVER_SURFACE } from "@/Components/boardui/components/base/dropdown/menu-styles";
import { InputBase } from "@/Components/boardui/components/base/input/input";
import { ChevronDownSmall } from "@/Components/boardui/components/foundations/icons/chevrons";
import { cx } from "@/Components/boardui/utils/cx";

const MATCHES = [
  { name: "Maya Chen", initials: "MC", color: "blue" },
  { name: "Mateo Ruiz", initials: "MR", color: "lime" },
  { name: "Amir Haddad", initials: "AH", color: "pink" },
] as const;

/**
 * The gallery tile: the field with "ma" typed and its list open beneath,
 * drawn statically from the same pieces (InputBase, the menu surface and
 * rows) so the card shows the open state at rest.
 */
export function ComboBoxPreviewCard() {
  return (
    <div className="absolute inset-0 flex justify-center px-5 pt-5">
      <div className="flex w-full max-w-[236px] flex-col gap-1">
        <InputBase
          aria-label="Assignee"
          defaultValue="ma"
          leadingIcon={RiSearchLine}
          trailingAddon={<ChevronDownSmall className="size-4 shrink-0 rotate-180 text-text-secondary" />}
        />
        <div className={cx(MENU_POPOVER_SURFACE, "flex w-full flex-col gap-1 p-2")}>
          {MATCHES.map((person, index) => (
            <div key={person.name} className={cx(MENU_ITEM, "text-body-medium", index === 0 && MENU_ITEM_ACTIVE)}>
              <Avatar size="sm" initials={person.initials} color={person.color} />
              <span className="flex-1 truncate">{person.name}</span>
              {index === 0 ? <RiCheckLine className="size-4 shrink-0 text-accent-500" aria-hidden /> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

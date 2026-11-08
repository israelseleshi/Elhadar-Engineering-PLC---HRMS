"use client";

import { createContext, useContext } from "react";
import type { ComponentType, ReactNode } from "react";
import {
  Button as AriaButton,
  Disclosure as AriaDisclosure,
  DisclosureGroup as AriaDisclosureGroup,
  DisclosurePanel as AriaDisclosurePanel,
  Heading as AriaHeading,
} from "react-aria-components";
import type { DisclosureGroupProps as AriaDisclosureGroupProps, DisclosureProps as AriaDisclosureProps } from "react-aria-components";
import { RiAddLine, RiArrowDownSLine } from "@remixicon/react";
import { cx, sortCx } from "@/Components/boardui/utils/cx";

/**
 * Accordion — stacked sections that expand in place: FAQs, settings groups,
 * order details. Built on React Aria's DisclosureGroup and Disclosure, so
 * each header is a real button with aria-expanded, and a collapsed panel is
 * `hidden="until-found"`: find-in-page still reaches its text and opens it.
 *
 *   <Accordion defaultExpandedKeys={["billing"]}>
 *     <AccordionItem id="billing" title="How does billing work?">…</AccordionItem>
 *     <AccordionItem id="seats" title="Can I add seats later?">…</AccordionItem>
 *   </Accordion>
 *
 * Variants: `divided` (hairlines between rows), `contained` (the landing
 * FAQ's tray of cards), and `separated` (one bordered card per item).
 *
 * Motion follows the agent limits card and Tree View: the panel's height
 * eases open over 300ms on cubic-bezier(0.22, 1, 0.36, 1) while its content
 * fades in, drops 4px into place and sharpens from a 4px blur; the indicator
 * turns with it (a chevron flips, a plus turns into a close). React Aria
 * measures the panel and exposes `--disclosure-panel-height`, so this is
 * all CSS. Reduced motion switches every transition off.
 */

type IconComponent = ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;

export type AccordionVariant = "divided" | "contained" | "separated";

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

const styles = sortCx({
  group: {
    divided: "flex flex-col divide-y divide-border",
    // The landing FAQ: cards on a tray, inverted in dark mode so the cards
    // stay a step lighter than the page.
    contained: "flex flex-col gap-1 rounded-2xl bg-muted/30 p-1.5",
    separated: "flex flex-col gap-2",
  },
  item: {
    divided: "",
    contained: "rounded-xl bg-card border border-border/70",
    separated: "rounded-xl border border-border bg-card shadow-xs",
  },
  trigger: {
    divided: "rounded-lg py-3 px-1",
    contained: "rounded-xl px-4 py-3",
    separated: "rounded-xl px-4 py-3",
  },
  content: {
    divided: "pb-4 px-1",
    contained: "px-4 pb-4",
    separated: "px-4 pb-4",
  },
});

interface AccordionContextValue {
  variant: AccordionVariant;
  indicator: "chevron" | "plus";
}

const AccordionContext = createContext<AccordionContextValue>({ variant: "divided", indicator: "chevron" });

export interface AccordionProps extends Omit<AriaDisclosureGroupProps, "className" | "children"> {
  variant?: AccordionVariant;
  /** `chevron` flips to point up; `plus` turns into a close. Default `chevron`. */
  indicator?: "chevron" | "plus";
  className?: string;
  children: ReactNode;
}

export function Accordion({ variant = "divided", indicator = "chevron", className, children, ...props }: AccordionProps) {
  return (
    <AccordionContext.Provider value={{ variant, indicator }}>
      <AriaDisclosureGroup {...props} className={cx(styles.group[variant], className)}>
        {children}
      </AriaDisclosureGroup>
    </AccordionContext.Provider>
  );
}

export interface AccordionItemProps extends Omit<AriaDisclosureProps, "className" | "children"> {
  title: ReactNode;
  /** Supporting line under the title, e.g. a summary of the settings inside. */
  description?: ReactNode;
  /** Remix Icon before the title. */
  icon?: IconComponent;
  /** Heading level of the title. Default 3. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  className?: string;
  children: ReactNode;
}

export function AccordionItem({
  title,
  description,
  icon: Icon,
  headingLevel = 3,
  className,
  children,
  ...props
}: AccordionItemProps) {
  const { variant, indicator } = useContext(AccordionContext);
  const Indicator = indicator === "plus" ? RiAddLine : RiArrowDownSLine;

  return (
    <AriaDisclosure
      {...props}
      className={cx("group/item data-[disabled]:opacity-50", styles.item[variant], className)}
    >
      <AriaHeading level={headingLevel} className="flex">
        <AriaButton
          slot="trigger"
          className={({ isFocusVisible }) =>
            cx(
              "group/trigger flex w-full cursor-pointer items-center gap-3 text-start outline-none",
              "disabled:cursor-not-allowed",
              isFocusVisible && "ring-2 ring-border-focus-ring ring-inset",
              styles.trigger[variant],
            )
          }
        >
          {Icon ? <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden /> : null}
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-sm font-semibold text-foreground">{title}</span>
            {description ? <span className="text-xs text-muted-foreground">{description}</span> : null}
          </span>
          <Indicator
            aria-hidden
            className={cx(
              "size-5 shrink-0 text-muted-foreground transition-[rotate,color] duration-300 motion-reduce:transition-none",
              EASE,
              "group-hover/trigger:text-foreground group-data-[expanded]/item:text-primary",
              indicator === "plus" ? "group-data-[expanded]/item:rotate-45" : "group-data-[expanded]/item:rotate-180",
            )}
          />
        </AriaButton>
      </AriaHeading>
      <AriaDisclosurePanel
        className={cx("h-(--disclosure-panel-height) overflow-clip transition-[height] duration-300 motion-reduce:transition-none", EASE)}
      >
        <div
          className={cx(
            "text-xs leading-relaxed text-foreground/90",
            "opacity-0 transition-[opacity,translate,filter] duration-300 motion-reduce:transition-none",
            "motion-safe:-translate-y-1 motion-safe:blur-[4px]",
            "group-data-[expanded]/item:translate-y-0 group-data-[expanded]/item:opacity-100 group-data-[expanded]/item:blur-[0px]",
            EASE,
            styles.content[variant],
          )}
        >
          {children}
        </div>
      </AriaDisclosurePanel>
    </AriaDisclosure>
  );
}

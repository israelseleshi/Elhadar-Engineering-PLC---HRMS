import React, { forwardRef, AnchorHTMLAttributes, ReactNode } from "react";
import { Link as InertiaLink } from "@inertiajs/react";

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  children?: ReactNode;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  passHref?: boolean;
}

const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, children, prefetch, replace, scroll, shallow, passHref, ...props },
  ref
) {
  if (
    typeof href === "string" &&
    (href.startsWith("http://") ||
      href.startsWith("https://") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("#"))
  ) {
    return (
      <a ref={ref} href={href} {...props}>
        {children}
      </a>
    );
  }

  return (
    <InertiaLink ref={ref as any} href={href} {...(props as any)}>
      {children}
    </InertiaLink>
  );
});

export default Link;

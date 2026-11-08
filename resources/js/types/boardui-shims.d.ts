import "react";

declare module "react" {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    inert?: boolean | "" | undefined;
  }
}

declare module "framer-motion" {
  interface HTMLMotionProps<T> {
    inert?: boolean | "" | undefined;
  }
}

declare module "motion" {
  interface HTMLMotionProps<T> {
    inert?: boolean | "" | undefined;
  }
}

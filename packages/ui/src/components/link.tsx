import { createLink, type LinkComponent } from "@tanstack/react-router";
import {
  type AriaLinkOptions,
  mergeProps,
  useFocusRing,
  useHover,
  useLink,
  useObjectRef,
} from "react-aria";
import { tv } from "tailwind-variants";

// import { ring } from '../../lib/utils'; // Assuming 'ring' is a utility from '../../lib/utils'

export interface AriaLinkProps extends Omit<AriaLinkOptions, "href"> {
  children?: React.ReactNode;
  className?: string;
}

const linkStyles = tv({
  // extend: ring, // Commented out due to missing 'ring' export
  base: ["flex items-center gap-2 text-primary text-sm", "hover:underline"],
});

const AriaLinkComponent = ({
  className,
  ...props
}: AriaLinkProps & { ref?: React.Ref<HTMLAnchorElement> }) => {
  const ref = useObjectRef(props.ref);

  const { isPressed, linkProps } = useLink(props, ref);
  const { isHovered, hoverProps } = useHover(props);
  const { isFocusVisible, isFocused, focusProps } = useFocusRing(props);

  return (
    <a
      {...mergeProps(linkProps, hoverProps, focusProps, props)}
      className={linkStyles({ className })}
      data-focus-visible={isFocusVisible || undefined}
      data-focused={isFocused || undefined}
      data-hovered={isHovered || undefined}
      data-pressed={isPressed || undefined}
      ref={ref}
    />
  );
};

AriaLinkComponent.displayName = "AriaLinkComponent";

const CreatedLinkComponent = createLink(AriaLinkComponent);

export const Link: LinkComponent<typeof AriaLinkComponent> = (props) => (
  <CreatedLinkComponent preload="intent" {...props} />
);

import type { MouseEvent, ReactElement, ReactNode } from "react";

/**
 * Props for {@link ExternalLink}.
 */
export interface ExternalLinkProps {
  /**
   * Absolute URL, or null to render plain text.
   */
  href: string | null | undefined;

  /**
   * Link content.
   */
  children: ReactNode;

  /**
   * Optional class name on the anchor.
   */
  className?: string;

  /**
   * Optional title for accessibility / tooltip.
   */
  title?: string;
}

/**
 * Opens an external forge URL in a new tab, or plain children when href is missing.
 * Stops click propagation so parent buttons (group expand) do not fire.
 *
 * @param props - Component props
 */
export function ExternalLink(props: ExternalLinkProps): ReactElement {
  const { href, children, className, title } = props;

  if (!href) {
    return (
      <span className={className} title={title}>
        {children}
      </span>
    );
  }

  /**
   * Prevents parent expand/collapse toggles from receiving the click.
   *
   * @param event - Mouse event
   */
  function stopBubble(event: MouseEvent<HTMLAnchorElement>): void {
    event.stopPropagation();
  }

  return (
    <a
      className={className ? `dl-link ${className}` : "dl-link"}
      href={href}
      target="_blank"
      rel="noreferrer"
      title={title}
      onClick={stopBubble}
    >
      {children}
    </a>
  );
}

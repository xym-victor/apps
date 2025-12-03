import { actions, useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Text, TextProps } from "@saleor/macaw-ui";
import { useRouter } from "next/router";

export interface TextLinkProps extends TextProps {
  href: string;
  newTab?: boolean;
}

const BaseTextLink = (props: TextLinkProps) => {
  return (
    <Text target="_blank" as={"a"} textDecoration={"none"} rel="noopener noreferrer" {...props}>
      <Text transition={"ease"} size={props.size} color="info1">
        {props.children}
      </Text>
    </Text>
  );
};

export const TextLink = ({ href, newTab = false, children, ...props }: TextLinkProps) => {
  let appBridge: ReturnType<typeof useAppBridge>["appBridge"] | undefined;

  try {
    const result = useAppBridge();
    appBridge = result.appBridge;
  } catch (error) {
    // When used outside of AppBridgeProvider (e.g. Next.js error boundary),
    // we gracefully degrade to a normal link without AppBridge integration.
    // eslint-disable-next-line no-console
    console.warn("[TextLink] useAppBridge failed, falling back to plain link behavior", {
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    appBridge = undefined;
  }

  const { push } = useRouter();

  const onNewTabClick = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    event.preventDefault();

    if (!appBridge) {
      // eslint-disable-next-line no-console
      console.warn(
        "App bridge is not initialized, TextLink cannot be used with external links without it.",
      );
    }

    appBridge?.dispatch(
      actions.Redirect({
        to: href,
        newContext: true,
      }),
    );

    if (props.onClick) {
      props.onClick(event);
    }
  };

  const onInternalClick = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    event.preventDefault();

    push(href);

    if (props.onClick) {
      props.onClick(event);
    }
  };

  if (newTab) {
    return (
      <BaseTextLink href={href} onClick={onNewTabClick} {...props}>
        {children}
      </BaseTextLink>
    );
  } else {
    return (
      <BaseTextLink href={href} onClick={onInternalClick} {...props}>
        {children}
      </BaseTextLink>
    );
  }
};

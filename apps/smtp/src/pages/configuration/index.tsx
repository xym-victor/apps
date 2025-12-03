import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Box, Text } from "@saleor/macaw-ui";
import { NextPage } from "next";
import { useEffect, useState } from "react";

import { BasicLayout } from "../../components/basic-layout";
import { SectionWithDescription } from "../../components/section-with-description";
import {
  ConfigurationListItem,
  MessagingProvidersBox,
} from "../../modules/app-configuration/ui/messaging-providers-box";
import { appUrls } from "../../modules/app-configuration/urls";
import { trpcClient } from "../../modules/trpc/trpc-client";

const ConfigurationPage: NextPage = () => {
  const { appBridgeState } = useAppBridge();
  const [isAppBridgeReady, setIsAppBridgeReady] = useState(false);

  // Wait for AppBridge to be ready before making queries
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log("[SMTP][ConfigurationPage] appBridgeState change", {
      ready: appBridgeState?.ready,
      hasUser: Boolean(appBridgeState?.user),
      permissions: appBridgeState?.user?.permissions,
    });

    if (appBridgeState?.ready) {
      setIsAppBridgeReady(true);
    }
  }, [appBridgeState?.ready]);

  const { data: dataSmtp, isLoading: isLoadingSmtp } =
    trpcClient.smtpConfiguration.getConfigurations.useQuery(
      {},
      {
        enabled: isAppBridgeReady,
      },
    );

  const data: ConfigurationListItem[] = [
    ...(dataSmtp?.map((configuration) => ({
      name: configuration.name,
      provider: "smtp" as const,
      id: configuration.id,
      active: configuration.active,
    })) || []),
  ];

  const isLoading = isLoadingSmtp;

  if (!appBridgeState || !isAppBridgeReady) {
    // eslint-disable-next-line no-console
    console.log("[SMTP][ConfigurationPage] appBridge not ready yet", {
      hasAppBridgeState: Boolean(appBridgeState),
      isAppBridgeReady,
    });

    return null;
  }

  if (appBridgeState.user?.permissions.includes("MANAGE_APPS") === false) {
    // eslint-disable-next-line no-console
    console.warn("[SMTP][ConfigurationPage] user lacks MANAGE_APPS permission", {
      permissions: appBridgeState.user?.permissions,
    });

    return <Text>You do not have permission to access this page.</Text>;
  }

  return (
    <BasicLayout breadcrumbs={[{ name: "Configuration", href: appUrls.configuration() }]}>
      <Box display="grid" gridTemplateColumns={{ desktop: 3, mobile: 1 }}>
        <Box>
          <Text>Configure SMTP app to deliver Saleor Event webhooks to SMTP servers.</Text>
        </Box>
      </Box>
      <SectionWithDescription
        title="Configurations"
        description={<Text>Manage configurations and modify it&apos;s message templates.</Text>}
      >
        <MessagingProvidersBox configurations={data || []} isLoading={isLoading} />
      </SectionWithDescription>
    </BasicLayout>
  );
};

export default ConfigurationPage;

import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { useDashboardNotification } from "@saleor/apps-shared/use-dashboard-notification";
import { Box, Text } from "@saleor/macaw-ui";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { BasicLayout } from "../../../components/basic-layout";
import { appUrls } from "../../../modules/app-configuration/urls";
import { SmtpConfiguration } from "../../../modules/smtp/configuration/smtp-config-schema";
import { SmtpBasicInformationSection } from "../../../modules/smtp/ui/smtp-basic-information-section";
import { SmtpChannelsSection } from "../../../modules/smtp/ui/smtp-channels-section";
import { SmtpDangerousSection } from "../../../modules/smtp/ui/smtp-dangerous-section";
import { SmtpEventsSection } from "../../../modules/smtp/ui/smtp-events-section";
import { SmtpSection } from "../../../modules/smtp/ui/smtp-section";
import { SmtpSenderSection } from "../../../modules/smtp/ui/smtp-sender-section";
import { trpcClient } from "../../../modules/trpc/trpc-client";

const LoadingView = () => {
  return (
    <BasicLayout
      breadcrumbs={[
        { name: "Configuration", href: appUrls.configuration() },
        { name: "SMTP provider" },
        { name: "..." },
      ]}
    >
      <Text size={10} fontWeight="bold">
        Loading...
      </Text>
    </BasicLayout>
  );
};

const NotFoundView = () => {
  return (
    <BasicLayout
      breadcrumbs={[
        { name: "Configuration", href: appUrls.configuration() },
        { name: "SMTP provider" },
        { name: "Not found" },
      ]}
    >
      <Text size={10} fontWeight="bold">
        Could not find the requested configuration.
      </Text>
    </BasicLayout>
  );
};

const EditSmtpConfigurationPage: NextPage = () => {
  const { appBridgeState } = useAppBridge();
  const router = useRouter();
  const [isAppBridgeReady, setIsAppBridgeReady] = useState(false);
  const configurationId = router.query.configurationId
    ? (router.query.configurationId as string)
    : undefined;

  // 使用 useEffect 等待 AppBridge 完全初始化
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log("[SMTP][EditSmtpConfigurationPage] appBridgeState change", {
      ready: appBridgeState?.ready,
      configurationId,
    });

    if (appBridgeState?.ready) {
      setIsAppBridgeReady(true);
    }
  }, [appBridgeState?.ready]);

  const { data: configuration, isLoading, error } = trpcClient.smtpConfiguration.getConfiguration.useQuery(
    {
      id: configurationId!,
    },
    {
      enabled: !!configurationId && isAppBridgeReady,
    },
  );

  // 只有在 AppBridge 完全准备好后才渲染内容
  if (!isAppBridgeReady) {
    // eslint-disable-next-line no-console
    console.log("[SMTP][EditSmtpConfigurationPage] AppBridge not ready yet", {
      configurationId,
      isAppBridgeReady,
    });

    return <LoadingView />;
  }

  if (isLoading) {
    // eslint-disable-next-line no-console
    console.log("[SMTP][EditSmtpConfigurationPage] loading configuration", {
      configurationId,
    });

    return <LoadingView />;
  }

  if (!configuration) {
    // eslint-disable-next-line no-console
    console.error("[SMTP][EditSmtpConfigurationPage] configuration not found", {
      configurationId,
      error,
    });

    return <NotFoundView />;
  }

  return (
    <EditSmtpConfigurationContent
      configuration={configuration}
      error={error}
    />
  );
};

// 分离内容组件，确保 AppBridge 准备好后才调用相关 hooks
type GetConfigurationQueryResult = ReturnType<
  typeof trpcClient.smtpConfiguration.getConfiguration.useQuery
>;
type GetConfigurationError = GetConfigurationQueryResult extends { error: infer E } ? E : never;

const EditSmtpConfigurationContent = ({
  configuration,
  error: queryError,
}: {
  configuration: SmtpConfiguration;
  error: GetConfigurationError;
}) => {
  const { notifyError } = useDashboardNotification();
  const router = useRouter();

  // 处理错误通知
  useEffect(() => {
    if (queryError) {
      // eslint-disable-next-line no-console
      console.error("[SMTP][EditSmtpConfigurationContent] queryError", {
        message: (queryError as unknown as Error)?.message,
        code: queryError.data?.code,
      });

      notifyError("Could not fetch configuration data");
      if (queryError.data?.code === "NOT_FOUND") {
        notifyError("The requested configuration does not exist.");
        router.replace(appUrls.configuration());
      }
    }
  }, [queryError, notifyError, router]);

  return (
    <BasicLayout
      breadcrumbs={[
        { name: "Configuration", href: appUrls.configuration() },
        { name: `SMTP: ${configuration.name}` },
      ]}
    >
      <Box display="grid" gridTemplateColumns={{ desktop: 3, mobile: 1 }}>
        <Box>
          <Text>Connect SMTP with Saleor.</Text>
        </Box>
      </Box>
      <SmtpBasicInformationSection configuration={configuration} />
      <SmtpSection configuration={configuration} />
      <SmtpSenderSection configuration={configuration} />
      <SmtpEventsSection configuration={configuration} />
      <SmtpChannelsSection configuration={configuration} />
      <SmtpDangerousSection configuration={configuration} />
    </BasicLayout>
  );
};

export default EditSmtpConfigurationPage;

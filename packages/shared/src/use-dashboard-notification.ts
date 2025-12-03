import { actions, useAppBridge } from "@saleor/app-sdk/app-bridge";
import { useCallback } from "react";

export const useDashboardNotification = () => {
  const { appBridge, appBridgeState } = useAppBridge();

  // Create notification functions that safely check before dispatching
  const safeDispatch = useCallback(
    (status: "success" | "error" | "warning" | "info", title: string, text?: string, apiMessage?: string) => {
      // eslint-disable-next-line no-console
      console.log("[SMTP][useDashboardNotification] safeDispatch called", {
        status,
        title,
        hasText: Boolean(text),
        hasApiMessage: Boolean(apiMessage),
        appBridgeReady: appBridgeState?.ready,
        hasAppBridge: Boolean(appBridge),
      });

      // Only dispatch when AppBridge is ready and available
      if (appBridgeState?.ready && appBridge) {
        try {
          // eslint-disable-next-line no-console
          console.log("[SMTP][useDashboardNotification] dispatching notification", {
            status,
            title,
          });

          appBridge.dispatch(
            actions.Notification({
              status,
              title,
              text,
              apiMessage,
            }),
          );
        } catch {
          // Silently ignore dispatch errors (e.g., if AppBridge disconnected)
          // eslint-disable-next-line no-console
          console.error("[SMTP][useDashboardNotification] failed to dispatch notification");
        }
      } else {
        // eslint-disable-next-line no-console
        console.warn("[SMTP][useDashboardNotification] skip dispatch: appBridge not ready or missing", {
          appBridgeReady: appBridgeState?.ready,
          hasAppBridge: Boolean(appBridge),
        });
      }
    },
    [appBridge, appBridgeState?.ready],
  );

  return {
    notifySuccess: useCallback(
      (title: string, text?: string) => {
        safeDispatch("success", title, text);
      },
      [safeDispatch],
    ),
    notifyError: useCallback(
      (title: string, text?: string, apiMessage?: string) => {
        safeDispatch("error", title, text, apiMessage);
      },
      [safeDispatch],
    ),
    notifyWarning: useCallback(
      (title: string, text?: string) => {
        safeDispatch("warning", title, text);
      },
      [safeDispatch],
    ),
    notifyInfo: useCallback(
      (title: string, text?: string) => {
        safeDispatch("info", title, text);
      },
      [safeDispatch],
    ),
  };
};

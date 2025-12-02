import { actions, useAppBridge } from "@saleor/app-sdk/app-bridge";
import { useCallback } from "react";

export const useDashboardNotification = () => {
  const { appBridge, appBridgeState } = useAppBridge();

  // Create notification functions that safely check before dispatching
  const safeDispatch = useCallback(
    (status: "success" | "error" | "warning" | "info", title: string, text?: string, apiMessage?: string) => {
      // Only dispatch when AppBridge is ready and available
      if (appBridgeState?.ready && appBridge) {
        try {
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
        }
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

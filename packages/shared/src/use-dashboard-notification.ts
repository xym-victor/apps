import { actions, useAppBridge } from "@saleor/app-sdk/app-bridge";
import { useCallback } from "react";

export const useDashboardNotification = () => {
  const { appBridge, appBridgeState } = useAppBridge();

  return {
    notifySuccess: useCallback(
      (title: string, text?: string) => {
        // Only dispatch notifications when AppBridge is ready
        if (appBridgeState?.ready && appBridge) {
          appBridge.dispatch(
            actions.Notification({
              status: "success",
              title,
              text,
            }),
          );
        }
      },
      [appBridge, appBridgeState?.ready],
    ),
    notifyError: useCallback(
      (title: string, text?: string, apiMessage?: string) => {
        // Only dispatch notifications when AppBridge is ready
        if (appBridgeState?.ready && appBridge) {
          appBridge.dispatch(
            actions.Notification({
              status: "error",
              title,
              text,
              apiMessage: apiMessage,
            }),
          );
        }
      },
      [appBridge, appBridgeState?.ready],
    ),
    notifyWarning: useCallback(
      (title: string, text?: string) => {
        // Only dispatch notifications when AppBridge is ready
        if (appBridgeState?.ready && appBridge) {
          appBridge.dispatch(
            actions.Notification({
              status: "warning",
              title,
              text,
            }),
          );
        }
      },
      [appBridge, appBridgeState?.ready],
    ),
    notifyInfo: useCallback(
      (title: string, text?: string) => {
        // Only dispatch notifications when AppBridge is ready
        if (appBridgeState?.ready && appBridge) {
          appBridge.dispatch(
            actions.Notification({
              status: "info",
              title,
              text,
            }),
          );
        }
      },
      [appBridge, appBridgeState?.ready],
    ),
  };
};

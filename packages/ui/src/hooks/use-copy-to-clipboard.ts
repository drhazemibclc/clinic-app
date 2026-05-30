// hooks/useCopyToClipboard.ts
"use client";

import { useTiks } from "@rexa-developer/tiks/react";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner"; // Optional: Add toast notifications
import { useWebHaptics } from "web-haptics/react";

export type CopyState = "idle" | "done" | "error";

export type UseCopyToClipboardOptions = {
  /** Called when copy succeeds */
  onCopySuccess?: (text: string) => void;
  /** Called when copy fails */
  onCopyError?: (error: Error) => void;
  /** Time in ms before resetting state from done/error to idle */
  resetDelay?: number;
  /** Show toast notification on copy */
  showToast?: boolean;
  /** Custom success message */
  successMessage?: string;
  /** Custom error message */
  errorMessage?: string;
  /** Enable haptic feedback on mobile devices */
  enableHaptics?: boolean;
  /** Enable tiks sound feedback */
  enableSound?: boolean;
};

export type UseCopyToClipboardReturn = {
  /** Current copy state: 'idle', 'done', or 'error' */
  state: CopyState;
  /** Copy text to clipboard function */
  copy: (text: string | (() => string)) => Promise<boolean>;
  /** Reset state to idle */
  reset: () => void;
  /** Whether copy is in progress */
  isCopying: boolean;
};

/**
 * Hook for copying text to clipboard with haptic and sound feedback
 *
 * @example
 * ```tsx
 * const { copy, state } = useCopyToClipboard({
 *   onCopySuccess: (text) => console.log(`Copied: ${text}`),
 *   showToast: true,
 *   successMessage: "Copied to clipboard!"
 * });
 *
 * return (
 *   <button onClick={() => copy("Hello World")}>
 *     {state === "done" ? "Copied!" : "Copy"}
 *   </button>
 * );
 * ```
 */
export function useCopyToClipboard({
  onCopySuccess,
  onCopyError,
  resetDelay = 1500,
  showToast = true,
  successMessage = "Copied to clipboard!",
  errorMessage = "Failed to copy",
  enableHaptics = true,
  enableSound = true,
}: UseCopyToClipboardOptions = {}): UseCopyToClipboardReturn {
  const [state, setState] = useState<CopyState>("idle");
  const [isCopying, setIsCopying] = useState(false);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Optional haptics and sound (with error handling)
  const { trigger: haptic, isSupported: hapticSupported } = useWebHaptics();
  const { success: tiksSuccess, error: tiksError } = useTiks();

  // Reset state function
  const reset = useCallback(() => {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
    setState("idle");
    setIsCopying(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Copy mutation using TanStack Query
  const copyMutation = useMutation({
    mutationFn: async (text: string): Promise<string> => {
      // Create abort controller for timeout
      abortControllerRef.current = new AbortController();
      const timeoutId = setTimeout(
        () => abortControllerRef.current?.abort(),
        5000,
      );

      try {
        // Check if clipboard API is available
        if (!navigator?.clipboard) {
          throw new Error("Clipboard API not supported");
        }

        // Write to clipboard
        await navigator.clipboard.writeText(text);
        clearTimeout(timeoutId);
        return text;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      } finally {
        abortControllerRef.current = null;
      }
    },
    onSuccess: (copiedText) => {
      setState("done");
      setIsCopying(false);

      // Haptic feedback
      if (enableHaptics && hapticSupported) {
        try {
          haptic("success");
        } catch (error) {
          console.warn("Haptic feedback failed:", error);
        }
      }

      // Sound feedback
      if (enableSound) {
        try {
          tiksSuccess();
        } catch (error) {
          console.warn("Sound feedback failed:", error);
        }
      }

      // Toast notification
      if (showToast) {
        toast.success(successMessage, {
          description: `"${copiedText.slice(0, 50)}${copiedText.length > 50 ? "..." : ""}"`,
          duration: 2000,
        });
      }

      // Callback
      onCopySuccess?.(copiedText);

      // Schedule reset
      resetTimeoutRef.current = setTimeout(() => {
        setState("idle");
      }, resetDelay);
    },
    onError: (error) => {
      setState("error");
      setIsCopying(false);

      // Haptic feedback for error
      if (enableHaptics && hapticSupported) {
        try {
          haptic("error");
        } catch (e) {
          console.warn("Haptic feedback failed:", e);
        }
      }

      // Sound feedback for error
      if (enableSound) {
        try {
          tiksError();
        } catch (e) {
          console.warn("Sound feedback failed:", e);
        }
      }

      // Toast notification for error
      if (showToast) {
        toast.error(errorMessage, {
          description: error instanceof Error ? error.message : "Unknown error",
          duration: 3000,
        });
      }

      // Callback
      const copyError =
        error instanceof Error ? error : new Error("Copy failed");
      onCopyError?.(copyError);

      // Schedule reset
      resetTimeoutRef.current = setTimeout(() => {
        setState("idle");
      }, resetDelay);
    },
  });

  // Copy function
  const copy = useCallback(
    async (text: string | (() => string)): Promise<boolean> => {
      // Clear any pending reset
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
        resetTimeoutRef.current = null;
      }

      // Reset state if needed
      if (state !== "idle") {
        setState("idle");
      }

      setIsCopying(true);

      try {
        const finalText = typeof text === "function" ? text() : text;

        if (!finalText || typeof finalText !== "string") {
          throw new Error("Invalid text to copy");
        }

        await copyMutation.mutateAsync(finalText);
        return true;
      } catch (error) {
        console.error("Copy failed:", error);
        return false;
      }
    },
    [copyMutation, state],
  );

  return {
    state,
    copy,
    reset,
    isCopying,
  };
}

// Optional: Create a specialized hook for medical data copying
export function useCopyMedicalData() {
  const copyToClipboard = useCopyToClipboard({
    showToast: true,
    successMessage: "Medical data copied to clipboard",
    errorMessage: "Failed to copy medical data",
    enableHaptics: true,
    enableSound: true,
  });

  const copyPatientId = useCallback(
    (patientId: string, patientName: string) => {
      return copyToClipboard.copy(`${patientName} (ID: ${patientId})`);
    },
    [copyToClipboard],
  );

  const copyDiagnosis = useCallback(
    (diagnosis: string, icdCode?: string) => {
      const text = icdCode ? `${diagnosis} [${icdCode}]` : diagnosis;
      return copyToClipboard.copy(text);
    },
    [copyToClipboard],
  );

  const copyPrescription = useCallback(
    (medication: string, dosage: string, frequency: string) => {
      const text = `${medication}: ${dosage} - ${frequency}`;
      return copyToClipboard.copy(text);
    },
    [copyToClipboard],
  );

  return {
    ...copyToClipboard,
    copyPatientId,
    copyDiagnosis,
    copyPrescription,
  };
}

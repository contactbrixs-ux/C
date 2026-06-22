"use client";

import { useState, useEffect, useCallback } from "react";
import {
  isConnected,
  getAddress,
  requestAccess,
  setAllowed,
} from "@stellar/freighter-api";

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  const checkConnection = useCallback(async () => {
    try {
      const { isConnected: connected } = await isConnected();
      if (connected) {
        const { address } = await getAddress();
        setState((prev) => ({
          ...prev,
          address,
          isConnected: true,
          error: null,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          address: null,
          isConnected: false,
          error: null,
        }));
      }
    } catch (err) {
      console.error("Error checking wallet connection:", err);
      setState((prev) => ({
        ...prev,
        isConnected: false,
        error: "Freighter wallet not detected. Please install the Freighter extension.",
      }));
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const connect = useCallback(async () => {
    setState((prev) => ({ ...prev, isConnecting: true, error: null }));
    try {
      // Request access to the wallet
      await setAllowed();
      const { address } = await getAddress();
      setState({
        address,
        isConnected: true,
        isConnecting: false,
        error: null,
      });
      return address;
    } catch (err: any) {
      const errorMsg = err?.message || "Failed to connect wallet";
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: errorMsg,
      }));
      return null;
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({
      address: null,
      isConnected: false,
      isConnecting: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    checkConnection,
  };
}

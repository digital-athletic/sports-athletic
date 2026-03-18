import { useState, useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";

/** Returns reactive boolean representing current network connectivity. */
export function useNetworkState(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    NetInfo.fetch().then((state) => {
      setIsOnline(!!(state.isConnected && state.isInternetReachable !== false));
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(!!(state.isConnected && state.isInternetReachable !== false));
    });

    return () => unsubscribe();
  }, []);

  return isOnline;
}

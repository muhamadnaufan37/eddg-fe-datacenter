import { createContext, useContext } from "react";

interface InspectContextValue {
  isInspectOpen: boolean;
}

export const InspectContext = createContext<InspectContextValue>({
  isInspectOpen: false,
});

export const useInspectContext = () => useContext(InspectContext);

export const InspectProvider = InspectContext.Provider;

import React, { ReactNode } from "react";
import { ThemeContext, ThemeContextProps } from "./ThemeContextDefinition";

interface ThemeProviderProps {
  value: ThemeContextProps;
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  value,
  children,
}) => {
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

"use client";

import { createContext, useContext } from "react";

export type AdminInfo = {
  adminId: string;
  adminName: string;
  adminEmail: string;
};

const AdminContext = createContext<AdminInfo | null>(null);

export const AdminProvider = AdminContext.Provider;

export function useAdmin(): AdminInfo {
  const value = useContext(AdminContext);
  if (!value) throw new Error("useAdmin must be used inside <AdminShell>.");
  return value;
}

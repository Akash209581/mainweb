"use client";
import { useEffect } from "react";
import { attachInputValidation } from "@/lib/client/input-validation";
export function PublicInputValidation() {
  useEffect(() => attachInputValidation(document), []);
  return null;
}

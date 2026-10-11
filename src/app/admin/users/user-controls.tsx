"use client";

import { userStatusAction } from "@/app/actions/admin";
import { ConfirmAction } from "@/components/ui/confirm-form";

export function UserControls({ id, status }: { id: string; status: string }) {
  return status === "ACTIVE" ? (
    <ConfirmAction action={userStatusAction} fields={{ userId: id, status: "SUSPENDED" }} label="Suspend" variant="danger" danger title="Suspend this user?" body="They are signed out everywhere and their published listings are paused." confirmLabel="Suspend" />
  ) : (
    <ConfirmAction action={userStatusAction} fields={{ userId: id, status: "ACTIVE" }} label="Reactivate" title="Reactivate this user?" body="They can sign in again. Paused listings stay paused." confirmLabel="Reactivate" />
  );
}

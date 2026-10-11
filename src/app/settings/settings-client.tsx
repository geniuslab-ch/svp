"use client";

import { changePasswordAction } from "@/app/actions/auth";
import { deleteAccountAction, notificationPrefsAction } from "@/app/actions/account";
import { ActionForm, Checkbox, Field, Input, SubmitButton } from "@/components/ui/form";

export function NotificationPrefsForm(p: { requests: boolean; messages: boolean; updates: boolean }) {
  return (
    <ActionForm action={notificationPrefsAction} successToast className="space-y-2">
      <Checkbox name="requests" defaultChecked={p.requests} label="Access requests and decisions" />
      <Checkbox name="messages" defaultChecked={p.messages} label="New messages and offers" />
      <Checkbox name="updates" defaultChecked={p.updates} label="Updates to listings I saved, verification results" />
      <div className="pt-3"><SubmitButton size="sm" pendingText="Saving…">Save preferences</SubmitButton></div>
    </ActionForm>
  );
}

export function PasswordForm() {
  return (
    <ActionForm action={changePasswordAction} successToast resetOnSuccess className="grid max-w-lg gap-4">
      <Field name="currentPassword" label="Current password"><Input name="currentPassword" type="password" autoComplete="current-password" /></Field>
      <Field name="newPassword" label="New password" hint="At least 10 characters, with a letter and a number."><Input name="newPassword" type="password" autoComplete="new-password" /></Field>
      <div><SubmitButton size="sm" pendingText="Saving…">Update password</SubmitButton></div>
    </ActionForm>
  );
}

export function DeleteAccountForm() {
  return (
    <ActionForm action={deleteAccountAction} className="grid max-w-lg gap-4 rounded-xl border border-clay/30 p-5">
      <p className="text-sm text-ivory-300">This cannot be undone.</p>
      <Field name="password" label="Your password"><Input name="password" type="password" autoComplete="current-password" /></Field>
      <Field name="confirm" label="Type DELETE to confirm"><Input name="confirm" autoComplete="off" /></Field>
      <div><SubmitButton variant="danger" size="sm" pendingText="Deleting…">Permanently delete my account</SubmitButton></div>
    </ActionForm>
  );
}

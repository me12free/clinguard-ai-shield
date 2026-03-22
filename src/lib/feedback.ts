import { toast } from "sonner";

/** User-visible feedback for async actions. Use with Sonner `<Toaster />` in `App`. */
export function notifySuccess(title: string, description?: string): void {
  toast.success(title, description ? { description } : undefined);
}

export function notifyError(title: string, description?: string): void {
  toast.error(title, description ? { description } : undefined);
}

export function notifyWarning(title: string, description?: string): void {
  toast.warning(title, description ? { description } : undefined);
}

export function notifyInfo(title: string, description?: string): void {
  toast.message(title, description ? { description } : undefined);
}

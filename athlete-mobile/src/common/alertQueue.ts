import type { AlertButton } from "./Alert";

export interface AlertRequest {
  title: string;
  message?: string;
  buttons: AlertButton[];
}

export interface DialogSlots {
  confirm: AlertButton;
  dismiss?: AlertButton;
}

type Listener = () => void;

const DEFAULT_BUTTONS: AlertButton[] = [{ text: "OK" }];

let queue: AlertRequest[] = [];
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener());
}

/** Queued alerts wait until the shown one is dismissed, so no callback is lost */
export function enqueueAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
) {
  const request: AlertRequest = {
    title,
    message,
    buttons: buttons && buttons.length > 0 ? buttons : DEFAULT_BUTTONS,
  };
  queue = [...queue, request];
  notify();
}

export function dismissCurrentAlert() {
  queue = queue.slice(1);
  notify();
}

export function getCurrentAlert(): AlertRequest | null {
  return queue[0] ?? null;
}

export function subscribeAlerts(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Last button confirms, the one before dismisses: the Android button order */
export function toDialogSlots(buttons: AlertButton[]): DialogSlots {
  const confirm = buttons[buttons.length - 1] ?? DEFAULT_BUTTONS[0];
  const dismiss = buttons.length > 1 ? buttons[buttons.length - 2] : undefined;
  return { confirm, dismiss };
}

import type { AlertButton } from "./Alert";

export interface AlertRequest {
  /** Unique per alert, so each one gets its own dialog */
  id: number;
  title: string;
  message?: string;
  buttons: AlertButton[];
}

export interface DialogSlots {
  confirm: AlertButton;
  dismiss?: AlertButton;
  neutral?: AlertButton;
}

type Listener = () => void;

const DEFAULT_BUTTONS: AlertButton[] = [{ text: "OK" }];

let queue: AlertRequest[] = [];
let nextId = 0;
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
  nextId += 1;
  const request: AlertRequest = {
    id: nextId,
    title,
    message,
    buttons: buttons && buttons.length > 0 ? buttons : DEFAULT_BUTTONS,
  };
  queue = [...queue, request];
  notify();
}

/** Closes the given alert if it is shown; false when it was already closed */
export function dismissAlert(request: AlertRequest): boolean {
  if (queue[0] !== request) return false;
  queue = queue.slice(1);
  notify();
  return true;
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

/**
 * Same mapping as React Native on Android: of the first three buttons the last
 * confirms, the one before dismisses and the first is neutral. Further buttons are dropped
 */
export function toDialogSlots(buttons: AlertButton[]): DialogSlots {
  const [confirm = DEFAULT_BUTTONS[0], dismiss, neutral] = buttons
    .slice(0, 3)
    .reverse();
  return { confirm, dismiss, neutral };
}

import * as React from "react";

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 4000;

type ToastVariant = "default" | "destructive";

type Toast = {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  action?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type Action =
  | { type: "ADD_TOAST"; toast: Toast }
  | { type: "UPDATE_TOAST"; toast: Partial<Toast> & { id: string } }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string };

interface State { toasts: Toast[] }

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

function addToRemoveQueue(toastId: string, dispatch: React.Dispatch<Action>) {
  if (toastTimeouts.has(toastId)) return;
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({ type: "REMOVE_TOAST", toastId });
  }, TOAST_REMOVE_DELAY);
  toastTimeouts.set(toastId, timeout);
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_TOAST":
      return { toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) };
    case "UPDATE_TOAST":
      return { toasts: state.toasts.map((t) => t.id === action.toast.id ? { ...t, ...action.toast } : t) };
    case "DISMISS_TOAST": {
      const { toastId } = action;
      if (toastId) addToRemoveQueue(toastId, dispatch);
      else state.toasts.forEach((t) => addToRemoveQueue(t.id, dispatch));
      return { toasts: state.toasts.map((t) => (!toastId || t.id === toastId) ? { ...t, open: false } : t) };
    }
    case "REMOVE_TOAST":
      return { toasts: action.toastId ? state.toasts.filter((t) => t.id !== action.toastId) : [] };
  }
}

let dispatch: React.Dispatch<Action> = () => {};
let memoryState: State = { toasts: [] };
const listeners: Array<React.Dispatch<React.SetStateAction<State>>> = [];

function globalDispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((l) => l(memoryState));
}
dispatch = globalDispatch;

let count = 0;
function genId() { count = (count + 1) % Number.MAX_SAFE_INTEGER; return count.toString(); }

function toast(props: Omit<Toast, "id">) {
  const id = genId();
  const dismiss = () => globalDispatch({ type: "DISMISS_TOAST", toastId: id });
  globalDispatch({ type: "ADD_TOAST", toast: { ...props, id, open: true, onOpenChange: (open) => { if (!open) dismiss(); } } });
  return { id, dismiss };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);
  React.useEffect(() => {
    listeners.push(setState);
    return () => { const i = listeners.indexOf(setState); if (i > -1) listeners.splice(i, 1); };
  }, []);
  return {
    toasts: state.toasts,
    toast,
    dismiss: (toastId?: string) => globalDispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { useToast, toast };

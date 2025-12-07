export type ActionState = {
    status: "idle" | "success" | "error";
    message?: string;
};

export const CLASS_ACTION_INITIAL_STATE: ActionState = {
    status: "idle",
};

export function getInitialActionState(): ActionState {
    return CLASS_ACTION_INITIAL_STATE;
}


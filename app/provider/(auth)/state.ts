export type AuthActionState = {
    status: "idle" | "success" | "error";
    message?: string;
    email?: string;
};

export const AUTH_INITIAL_STATE: AuthActionState = {
    status: "idle",
};


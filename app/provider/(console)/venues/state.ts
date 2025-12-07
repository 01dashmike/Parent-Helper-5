export type VenueActionState = {
    status: "idle" | "success" | "error";
    message?: string;
};

export const VENUE_ACTION_INITIAL_STATE: VenueActionState = {
    status: "idle",
};

export function getInitialVenueState(): VenueActionState {
    return VENUE_ACTION_INITIAL_STATE;
}


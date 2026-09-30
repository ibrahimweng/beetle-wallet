/* What the keypad page hands back to the goal: the figure to put away. The
   page takes it the moment it is in front, and asks for the passcode. */
export type GoalDraft = { amount?: number };

let waiting: GoalDraft | null = null;

export const goalDraft = {
  put(d: GoalDraft) {
    waiting = { ...(waiting ?? {}), ...d };
  },
  take(): GoalDraft | null {
    const d = waiting;
    waiting = null;
    return d;
  },
};

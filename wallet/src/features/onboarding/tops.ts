/* Where the way in's top things sit (Round 29). The owner's frames put the
   logo 56 from the top and the way back at 52, right for a 393 by 852
   phone, whose top inset is 59. A phone whose own top reaches further
   (the Pro's 62) has them come down with it, so nothing sits up under the
   island; one with less (an SE's 20) keeps the frame's. The opening's logo
   rises to the same place the welcome's sits. */
export const logoTop = (inset: number) => Math.max(56, Math.round(inset) - 3);
export const backTop = (inset: number) => Math.max(52, Math.round(inset) - 7);

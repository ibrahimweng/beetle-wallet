/* The camera for an ID, over the way in (Round 33). Opened from the app's own
   stack, coming back from it landed on home and the way in was gone, so
   finishing setting up came back to the same step for ever, and nobody could
   get to borrowing. Here it is pushed over the way in, and back is back to it.
   See src/features/scan. */
import React from 'react';
import { Scan } from '../src/features/scan/Scan';

export default function IdPhotoRoute() {
  return <Scan />;
}

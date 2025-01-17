import { useDeferredValue } from "react";

import { getExecutionPoint, getTime } from "devtools/client/debugger/src/selectors";
import {
  getCurrentTime,
  getHoverTime,
  getPlayback,
  getShowHoverTimeGraphics,
} from "ui/reducers/timeline";
import { useAppSelector } from "ui/setup/hooks";

export function useSmartTimeAndExecutionPoint() {
  const playbackState = useAppSelector(getPlayback);
  const hoverTime = useAppSelector(getHoverTime);
  const preferHoverTime = useAppSelector(getShowHoverTimeGraphics);
  const pauseExecutionPoint = useAppSelector(getExecutionPoint);
  const pauseTime = useAppSelector(getTime);
  const currentTime = useAppSelector(getCurrentTime);

  // The "current time" represents the time shown on the Timeline
  // This is the time the user sets when scrubbing the timeline as well as when playback is active
  //
  // The "pause time" is a higher-fidelity version of the current time
  // It is often accompanied by an execution point and a pause id (which can be used to inspect values in the debugger)
  //
  // When possible, it is better to use the "pause time" for displaying graphics
  // because it enables us to display a more up-to-date screenshot from DOM.repaintGraphics
  //
  // There are situations where we should not use this value though
  // For instance, if the user scrubs the timeline outside of the focus window, a Pause can't be created
  // In that case, we should show the lower-fidelity playback time so the screenshot and timeline line up
  //
  // A heuristic for detecting this case is comparing how close the two values are
  const preferCurrentTime = playbackState != null || Math.abs(pauseTime - currentTime) > 0.05;

  let executionPoint: string | null = null;
  let time = 0;
  if (preferCurrentTime) {
    time = currentTime;
  } else if (preferHoverTime && hoverTime != null) {
    time = hoverTime;
  } else {
    time = pauseTime;
    executionPoint = pauseExecutionPoint;
  }

  return useDeferredValue({ executionPoint, time });
}

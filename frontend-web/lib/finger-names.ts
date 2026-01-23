import { FingerName } from "@/types/fingerprint";

export const FINGER_NAMES: Record<FingerName, string> = {
  left_thumb: "Left Thumb",
  left_index: "Left Index",
  left_middle: "Left Middle",
  left_ring: "Left Ring",
  left_pinky: "Left Pinky",
  right_thumb: "Right Thumb",
  right_index: "Right Index",
  right_middle: "Right Middle",
  right_ring: "Right Ring",
  right_pinky: "Right Pinky",
};

export function getFingerLabel(finger: FingerName) {
  return FINGER_NAMES[finger];
}

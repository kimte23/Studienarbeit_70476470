import math
from mediapipe.python.solutions.hands import HandLandmark
import time
 

# This file implements the gestures and motions.
# It is explicitly seperated from the gesture_recognizer.py file to make it easier to add new gestures and motions.
# To add a new gesture or motion, add a new gesture name and implement the gesture / motion function.
# Then add the gesture / motion function to the functions list at the bottom of the file 
# so it will be checked for recognition every frame by the gesture recognizer.


# ---------------------------------------------------------------------------- #
#                                    Structs                                   #
# ---------------------------------------------------------------------------- #
class GestureResult():
    def __init__(self, was_gesture_recognized=False, gesture_name='no_gesture_recognized'):
        self.was_gesture_recognized = was_gesture_recognized
        self.gesture_name = gesture_name


# ---------------------------------------------------------------------------- #
#                                Helper fuctions                               #
# ---------------------------------------------------------------------------- #
def calculate_distance(point1, point2):
    return math.sqrt((point1.x - point2.x)**2 + (point1.y - point2.y)**2)


def are_fingers_extended(hand_landmarks, extended_threshold=0.1):
    tips = [
        HandLandmark.THUMB_TIP,
        HandLandmark.INDEX_FINGER_TIP,
        HandLandmark.MIDDLE_FINGER_TIP,
        HandLandmark.RING_FINGER_TIP,
        HandLandmark.PINKY_TIP
    ]
    
    mcps = [
        HandLandmark.THUMB_CMC,  # For thumb, use CMC as a base
        HandLandmark.INDEX_FINGER_MCP,
        HandLandmark.MIDDLE_FINGER_MCP,
        HandLandmark.RING_FINGER_MCP,
        HandLandmark.PINKY_MCP
    ]
    
    finger_extended = {}

    for tip, mcp in zip(tips, mcps):
        # Calculate Euclidean distance between the tip and MCP
        distance_tip_mcp = calculate_distance(hand_landmarks.landmark[tip], hand_landmarks.landmark[mcp])

        # Check if the tip is farther than the threshold from the MCP
        finger_extended[tip] = distance_tip_mcp > extended_threshold

    return finger_extended


def is_thumb_and_index_touching(hand_landmarks, base_threshold_ratio=0.2):
    thumb_tip = hand_landmarks.landmark[HandLandmark.THUMB_TIP]
    index_tip = hand_landmarks.landmark[HandLandmark.INDEX_FINGER_TIP]
    wrist = hand_landmarks.landmark[HandLandmark.WRIST]
    index_mcp = hand_landmarks.landmark[HandLandmark.INDEX_FINGER_MCP]

    # Calculate hand size as the distance between the wrist and index MCP
    hand_size = calculate_distance(wrist, index_mcp)

    # Dynamic threshold is a fraction of the hand size
    dynamic_threshold = base_threshold_ratio * hand_size

    # Check if the thumb tip and index tip are close to each other
    return calculate_distance(thumb_tip, index_tip) < dynamic_threshold


def get_hand_side(handedness):
    handedness = handedness.classification[0].label.lower()
    # Mirror the handedness
    if handedness == 'left':
        return 'right'
    elif handedness == 'right':
        return 'left'


def is_hand_raised(hand_landmarks):
    wrist = hand_landmarks.landmark[HandLandmark.WRIST]
    middle_mcp = hand_landmarks.landmark[HandLandmark.MIDDLE_FINGER_MCP]
    return wrist.y > middle_mcp.y  # Wrist should be below the middle MCP for the hand to be raised


# ---------------------------------------------------------------------------- #
#                             Single frame gestures                            #
# ---------------------------------------------------------------------------- #
def gesture_ok(multi_hand_landmarks, *args):
    for hand_landmarks in multi_hand_landmarks:
        if is_hand_raised(hand_landmarks) and is_thumb_and_index_touching(hand_landmarks):
            return GestureResult(True, 'ok')
        
    return GestureResult()


# ---------------------------------------------------------------------------- #
#                             Multi frame gestures                             #
# ---------------------------------------------------------------------------- #
class MultiFrameState:
    def __init__(self, gesture_duration_threshold=2.0, max_dropout_frames=5):
        self.start_time = None
        self.gesture_active = False
        self.dropout_count = 0
        self.gesture_duration_threshold = gesture_duration_threshold # How long the gesture should be active before it is recognized
        self.max_dropout_frames = max_dropout_frames # How many frames the gesture can be not recognized before it is resets
        self.multi_hand_landmarks_list = [] # Store multi_hand_landmarks here for gesture analysis (e.g. tracking hand positions)

    def reset(self):
        self.start_time = None
        self.gesture_active = False
        self.dropout_count = 0
        self.multi_hand_landmarks_list = []


class MultiFrameStateHandler:
    def __init__(self):
        self.states = []
    
    def increase_dropout_count_all(self):
        for state in self.states:
            state.dropout_count += 1
            if state.dropout_count > state.max_dropout_frames:
                state.reset()

    def increase_dropout_count(self, state):
        state.dropout_count += 1
        if state.dropout_count > state.max_dropout_frames:
            state.reset()

    def add_state(self, state):
        self.states.append(state)

    def reset_all(self):
        for state in self.states:
            state.reset()

multi_frame_state_handler = MultiFrameStateHandler()


toggle_freeze_state =  MultiFrameState(2, 5)
multi_frame_state_handler.add_state(toggle_freeze_state)

def gesture_toggle_freeze(multi_hand_landmarks, *args):
    state = toggle_freeze_state

    if len(multi_hand_landmarks) < 2:
        multi_frame_state_handler.increase_dropout_count(state)
        return GestureResult()
    
    # If hands are detected, reset dropout count
    state.dropout_count = 0

    both_hands_open = all([
        is_hand_raised(hand_landmarks) and are_fingers_extended(hand_landmarks)
        for hand_landmarks in multi_hand_landmarks
    ])

    if both_hands_open:
        # Start timing if not already active
        if state.start_time is None:
            state.start_time = time.time()
            state.gesture_active = True
        
        # Check if gesture has been active for long enough
        elapsed_time = time.time() - state.start_time
        if elapsed_time > state.gesture_duration_threshold:
            state.reset()
            return GestureResult(True, 'toggle_freeze')
        else:
            return GestureResult()

    # If gesture is not recognized, reset timing
    state.reset()
    return GestureResult()


switch_content_state = MultiFrameState(2, 5)
multi_frame_state_handler.add_state(switch_content_state)

def gesture_switch_content(multi_hand_landmarks, multi_handedness):
    state = switch_content_state

    # If hands are detected, reset dropout count
    state.dropout_count = 0

    left_hand_open = False
    right_hand_open = False

    for i in range(len(multi_hand_landmarks)):
        hand_landmark = multi_hand_landmarks[i]
        hand_side = get_hand_side(multi_handedness[i])
        if hand_side == 'left' and is_hand_raised(hand_landmark):
            left_hand_open = are_fingers_extended(hand_landmark)
        elif hand_side == 'right' and is_hand_raised(hand_landmark):
            right_hand_open = are_fingers_extended(hand_landmark)

    # Reset if both hands are open
    if left_hand_open and right_hand_open:
        state.reset()
        return GestureResult()
    
    # Check if gesture is active
    if left_hand_open or right_hand_open:
        if state.start_time is None:
            state.start_time = time.time()
            state.gesture_active = True
        
        # Check if gesture has been active for long enough
        elapsed_time = time.time() - state.start_time
        if elapsed_time > state.gesture_duration_threshold:
            state.reset()
            if left_hand_open:
                return GestureResult(True, 'switch_content_previous')
            if right_hand_open:
                return GestureResult(True, 'switch_content_next')
        else:
            return GestureResult()

    # If gesture is not recognized, reset timing
    state.reset()
    return GestureResult()



# ---------------------------------------------------------------------------- #
#                          Add gestures to analyze here                         #
# ---------------------------------------------------------------------------- #
functions = [
    # Single frame gestures
    gesture_ok,

    # Multi frame gestures
    gesture_toggle_freeze,
    gesture_switch_content,
]


# ---------------------------------------------------------------------------- #
#                                   Interface                                  #
# ---------------------------------------------------------------------------- #
def analyze_multi_hand_landmarks(multi_hand_landmarks, multi_handedness) -> GestureResult:
    # Check for all gestures
    for function in functions:
        gesture_result = function(multi_hand_landmarks, multi_handedness)
        if gesture_result.was_gesture_recognized:
            multi_frame_state_handler.reset_all()
            return gesture_result
    
    # No gesture recognized
    return GestureResult()

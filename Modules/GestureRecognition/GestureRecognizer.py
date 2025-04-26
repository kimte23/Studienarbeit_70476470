import cv2
import mediapipe as mp
import argparse
from GestureImplementations import analyze_multi_hand_landmarks, multi_frame_state_handler
from colorama import Fore, Style
from websocket_server import WebsocketServer
from threading import Thread


# This class handles the gesture recognition.
# Is a gesture is recognized, it emits the gesture to all listeners.
# First it reads the camera frames and processes them by utilizing the cv2 library.
# Then it uses the Mediapipe library to detect hands.
# Finally it checks for gestures defined in GestureImplementations.py file.
# If a gesture is recognized, it sends the gestures name to the server.


class GestureRecognizer:
    def __init__(self, socket_host, socket_port, skip_frames, debug, camera_index):
        self.socket_host = socket_host
        self.socket_port = socket_port
        self.skip_frames = skip_frames + 1
        self.debug = debug
        self.frame_count = 0

        if camera_index == -1:  # Special value to auto-detect camera
            self.cap = None
            for index in range(10):  # Try indices 0 to 9
                temp_cap = cv2.VideoCapture(index)
                if temp_cap.isOpened():
                    self.cap = temp_cap
                    print(f"Using camera at index {index}")
                    break
                temp_cap.release()
            if not self.cap:
                raise ValueError("No valid camera found in indices 0 to 9")
        else:
            self.cap = cv2.VideoCapture(camera_index)  # Open the specified camera
            if not self.cap.isOpened():
                raise ValueError(f"Could not open camera with index {camera_index}")

        self.hands = mp.solutions.hands.Hands(max_num_hands=2) # Initialize the hands module
        self.server = WebsocketServer(host=self.socket_host, port=self.socket_port)
        Thread(target=self.server.run_forever).start() # Start WebSocket server


    def run(self):
        while True:
            self.process_frame()
            if cv2.waitKey(1) == 27: # ESC key
                break

        # Release resources
        self.cap.release()
        cv2.destroyAllWindows()


    def process_frame(self):
        # Read frame from camera
        success, frame = self.cap.read()
        if not success:
            print(Fore.RED + "Could not read frame from camera." + Style.RESET_ALL)
            return

        # Increase frame count
        self.frame_count += 1

        # Skip frames
        if self.frame_count % self.skip_frames != 0:
            return

        # Convert frame from BGR to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Process the frame with the hands module
        frame_result = self.hands.process(rgb_frame)
        multi_hand_landmarks = frame_result.multi_hand_landmarks
        multi_handedness = frame_result.multi_handedness

        # If hands are detected, analyze the hand data
        if multi_hand_landmarks:
            gesture_result = analyze_multi_hand_landmarks(multi_hand_landmarks, multi_handedness)
            # Send gesture to all listeners
            # If no gesture was recognized, send an empty message
            self.server.send_message_to_all(gesture_result.gesture_name)

            if self.debug:
                # Draw gesture name on frame
                if gesture_result.was_gesture_recognized:
                    cv2.putText(frame, gesture_result.gesture_name, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2, cv2.LINE_AA)

                # For each detected hand draw hand landmarks and connections
                for hand_landmarks in multi_hand_landmarks:
                    mp.solutions.drawing_utils.draw_landmarks(frame, hand_landmarks, mp.solutions.hands.HAND_CONNECTIONS)
        else:
            # Increase dropout count
            multi_frame_state_handler.increase_dropout_count_all()

        # Render frame to screen
        if self.debug:
            cv2.imshow("GestureRecognizer", frame)


if __name__ == "__main__":
    # Parse command line arguments
    parser = argparse.ArgumentParser()
    parser.add_argument("--camera-index", type=int, default=-1, help="Camera index to use. Use -1 to auto-detect.")
    parser.add_argument("--skip-frames", type=int, default=0, help="Number of frames to skip. This will result in better performance but higher latency.")
    parser.add_argument("--debug", type=bool, default=False, help="Enable debug mode.")
    args = parser.parse_args()

    camera_index = args.camera_index
    skip_frames = args.skip_frames
    debug = args.debug

    recognizer = GestureRecognizer('localhost', 5001, skip_frames, debug, camera_index)
    recognizer.run()

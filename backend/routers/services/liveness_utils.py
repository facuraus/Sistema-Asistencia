import cv2
import mediapipe as mp

def detectar_rostro_y_verificar_vida(frame):
    mp_face_detection = mp.solutions.face_detection
    with mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5) as face_detection:
        results = face_detection.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        if results.detections:
            return True, "Rostro detectado"
        else:
            return False, "No se detectó rostro"

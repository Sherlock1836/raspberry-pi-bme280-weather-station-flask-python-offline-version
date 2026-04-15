import io
import os
import time
import threading
import cv2
from flask import Flask, render_template, jsonify, Response, send_file, request
from bme_module import BME280Module
from picamera2 import Picamera2

app = Flask(__name__)

# Ensure gallery directory exists
GALLERY_DIR = os.path.join('static', 'gallery')
os.makedirs(GALLERY_DIR, exist_ok=True)

recording = False
video_writer = None
video_filename = ""

try:
    bme280_module = BME280Module()
except Exception as e:
    print(f"Error initializing BME280 module: {e}")
    bme280_module = None
    
try:
    picam2 = Picamera2()

    # 2. Configure and Start the Camera Globally
    # We keep the resolution modest so the Pi Zero 2 W CPU doesn't bottleneck
    config = picam2.create_video_configuration(main={"size": (1280, 720)})
    picam2.configure(config)
    picam2.start()
except Exception as e:
    print(f"Error initializing Picamera2 module: {e}")
    picam2 = None

@app.route("/")
def hello_world():
    return render_template("index.html")


@app.route("/sensorReadings")
def get_sensor_readings():
    try:
        if bme280_module is None:
            raise Exception("BME280 module is not initialized.")
        temperature, pressure, humidity, altitude = bme280_module.get_sensor_readings()
        return jsonify(
            {
                "status": "OK",
                "temperature": temperature,
                "pressure": pressure,
                "humidity": humidity,
                "altitude": altitude,
            }
        )
    except Exception as e:
        return jsonify({"status": "Error", "message": str(e)}), 500
    
@app.route("/api/camera/capture", methods=["POST"])
def capture_photo():
    """Takes a single still shot and saves it to the gallery."""
    if picam2 is None:
        return jsonify({"error": "Camera is not initialized"}), 500

    frame = picam2.capture_array()
    timestamp = int(time.time())
    filename = f"photo_{timestamp}.jpg"
    filepath = os.path.join(GALLERY_DIR, filename)
    
    cv2.imwrite(filepath, frame)
    return jsonify({"status": "success", "url": f"/static/gallery/{filename}", "type": "photo"})

def record_loop():
    """Background thread function to write frames to a video file."""
    global recording, video_writer
    while recording:
        if picam2 is not None and video_writer is not None:
            try:
                frame = picam2.capture_array()
                video_writer.write(frame)
            except Exception as e:
                print(f"Error recording frame: {e}")
        time.sleep(0.1)  # Target roughly 10 FPS

@app.route('/api/camera/record/start', methods=['POST'])
def start_record():
    """Initializes the video writer and starts the recording thread."""
    global recording, video_writer, video_filename
    if picam2 is None: 
        return jsonify({"error": "Camera is not initialized"}), 500
        
    timestamp = int(time.time())
    filename = f"video_{timestamp}.avi"
    filepath = os.path.join(GALLERY_DIR, filename)
    
    # Initialize OpenCV VideoWriter using MJPG codec (compatible for downloads)
    fourcc = cv2.VideoWriter_fourcc(*'MJPG')
    video_writer = cv2.VideoWriter(filepath, fourcc, 10.0, (1280, 720))
    video_filename = filename
    recording = True
    
    threading.Thread(target=record_loop, daemon=True).start()
    return jsonify({"status": "recording started"})

@app.route('/api/camera/record/stop', methods=['POST'])
def stop_record():
    """Stops recording and finalizes the video file."""
    global recording, video_writer, video_filename
    recording = False
    if video_writer:
        video_writer.release()
        video_writer = None
    return jsonify({"status": "success", "url": f"/static/gallery/{video_filename}", "type": "video"})

@app.route('/api/gallery')
def get_gallery():
    """Returns a list of all saved photos and videos."""
    files = []
    if os.path.exists(GALLERY_DIR):
        for f in os.listdir(GALLERY_DIR):
            if f.endswith('.jpg') or f.endswith('.avi'):
                files.append({
                    "url": f"/static/gallery/{f}",
                    "type": "photo" if f.endswith('.jpg') else "video",
                    "name": f,
                    "time": os.path.getctime(os.path.join(GALLERY_DIR, f))
                })
    # Sort newest files first
    files.sort(key=lambda x: x['time'], reverse=True)
    return jsonify(files)

def generate_frames():
    """Generator function that yields JPEG frames for the live stream."""
    if picam2 is None:
        return

    while True:
        # Grab the current frame
        frame = picam2.capture_array()
        
        # Compress it to JPEG format
        # You can lower the quality (e.g., 80) to save bandwidth if needed:
        # ret, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
        ret, buffer = cv2.imencode('.jpg', frame)
        
        if ret:
            frame_bytes = buffer.tobytes()
            # Yield the frame in the standard MJPEG format
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            
@app.route("/stream")
def video_stream():
    """Returns the live video feed."""
    if picam2 is None:
        return "Camera is not initialized", 500

    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

# use reloader must be disabled so camera initialization doesn't get spammed
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', threaded=True, use_reloader=False)

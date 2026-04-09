import io
import cv2
from flask import Flask, render_template, jsonify, Response, send_file
from bme_module import BME280Module
from picamera2 import Picamera2

app = Flask(__name__)

try:
    bme280_module = BME280Module()
except Exception as e:
    print(f"Error initializing BME280 module: {e}")
    bme280_module = None
    
picam2 = Picamera2()

# 2. Configure and Start the Camera Globally
# We keep the resolution modest so the Pi Zero 2 W CPU doesn't bottleneck
config = picam2.create_video_configuration(main={"size": (1920, 1080)})
picam2.configure(config)
picam2.start()

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
    
@app.route("/photo")
def get_photo():
    """Takes a single still shot and returns it directly to the browser."""
    # We grab a frame directly from the running video configuration
    frame = picam2.capture_array()
    
    # Encode the array to a JPEG in memory (avoids wearing out the SD card)
    ret, buffer = cv2.imencode('.jpg', frame)
    
    if not ret:
        return "Failed to capture image", 500

    # Convert the buffer to a file-like object and send it
    image_stream = io.BytesIO(buffer)
    return send_file(image_stream, mimetype='image/jpeg')

def generate_frames():
    """Generator function that yields JPEG frames for the live stream."""
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
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

# use reloader must be disabled so camera initialization doesn't get spammed
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', threaded=True, use_reloader=False)

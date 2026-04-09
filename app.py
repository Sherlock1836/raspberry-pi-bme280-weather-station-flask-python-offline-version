from flask import Flask, render_template, jsonify
from bme_module import BME280Module

app = Flask(__name__)

try:
    bme280_module = BME280Module()
except Exception as e:
    print(f"Error initializing BME280 module: {e}")
    bme280_module = None

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

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')

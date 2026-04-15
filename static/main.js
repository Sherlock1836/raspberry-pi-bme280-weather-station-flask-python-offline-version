var temperatureHistoryDiv = document.getElementById("temperature-history");
var humidityHistoryDiv = document.getElementById("humidity-history");
var pressureHistoryDiv = document.getElementById("pressure-history");
var altitudeHistoryDiv = document.getElementById("altitude-history");

var temperatureGaugeDiv = document.getElementById("temperature-gauge");
var humidityGaugeDiv = document.getElementById("humidity-gauge");
var pressureGaugeDiv = document.getElementById("pressure-gauge");
var altitudeGaugeDiv = document.getElementById("altitude-gauge");

// History Data
var temperatureTrace = {
  x: [],
  y: [],
  name: "Temperature",
  mode: "lines+markers",
  type: "line",
};
var humidityTrace = {
  x: [],
  y: [],
  name: "Humidity",
  mode: "lines+markers",
  type: "line",
};
var pressureTrace = {
  x: [],
  y: [],
  name: "Pressure",
  mode: "lines+markers",
  type: "line",
};
var altitudeTrace = {
  x: [],
  y: [],
  name: "Altitude",
  mode: "lines+markers",
  type: "line",
};

var temperatureLayout = {
  autosize: false,
  title: {
    text: "Temperature",
  },
  font: {
    size: 14,
    color: "#7f7f7f",
  },
  colorway: ["#B22222"],
  width: 450,
  height: 260,
  margin: { t: 30, b: 20, pad: 5 },
};
var humidityLayout = {
  autosize: false,
  title: {
    text: "Humidity",
  },
  font: {
    size: 14,
    color: "#7f7f7f",
  },
  colorway: ["#00008B"],
  width: 450,
  height: 260,
  margin: { t: 30, b: 20, pad: 5 },
};
var pressureLayout = {
  autosize: false,
  title: {
    text: "Pressure",
  },
  font: {
    size: 14,
    color: "#7f7f7f",
  },
  colorway: ["#FF4500"],
  width: 450,
  height: 260,
  margin: { t: 30, b: 20, pad: 5 },
};
var altitudeLayout = {
  autosize: false,
  title: {
    text: "Altitude",
  },
  font: {
    size: 14,
    color: "#7f7f7f",
  },
  colorway: ["#008080"],
  width: 450,
  height: 260,
  margin: { t: 30, b: 20, pad: 5 },
};

Plotly.newPlot(temperatureHistoryDiv, [temperatureTrace], temperatureLayout);
Plotly.newPlot(humidityHistoryDiv, [humidityTrace], humidityLayout);
Plotly.newPlot(pressureHistoryDiv, [pressureTrace], pressureLayout);
Plotly.newPlot(altitudeHistoryDiv, [altitudeTrace], altitudeLayout);

// Gauge Data
var temperatureData = [
  {
    domain: { x: [0, 1], y: [0, 1] },
    value: 0,
    title: { text: "Temperature" },
    type: "indicator",
    mode: "gauge+number+delta",
    delta: { reference: 30 },
    gauge: {
      axis: { range: [null, 50] },
      steps: [
        { range: [0, 20], color: "lightgray" },
        { range: [20, 30], color: "gray" },
      ],
      threshold: {
        line: { color: "red", width: 4 },
        thickness: 0.75,
        value: 30,
      },
    },
  },
];

var humidityData = [
  {
    domain: { x: [0, 1], y: [0, 1] },
    value: 0,
    title: { text: "Humidity" },
    type: "indicator",
    mode: "gauge+number+delta",
    delta: { reference: 50 },
    gauge: {
      axis: { range: [null, 100] },
      steps: [
        { range: [0, 20], color: "lightgray" },
        { range: [20, 30], color: "gray" },
      ],
      threshold: {
        line: { color: "red", width: 4 },
        thickness: 0.75,
        value: 30,
      },
    },
  },
];

var pressureData = [
  {
    domain: { x: [0, 1], y: [0, 1] },
    value: 0,
    title: { text: "Pressure" },
    type: "indicator",
    mode: "gauge+number+delta",
    delta: { reference: 750 },
    gauge: {
      axis: { range: [null, 1100] },
      steps: [
        { range: [0, 300], color: "lightgray" },
        { range: [300, 700], color: "gray" },
      ],
      threshold: {
        line: { color: "red", width: 4 },
        thickness: 0.75,
        value: 30,
      },
    },
  },
];

var altitudeData = [
  {
    domain: { x: [0, 1], y: [0, 1] },
    value: 0,
    title: { text: "Altitude" },
    type: "indicator",
    mode: "gauge+number+delta",
    delta: { reference: 60 },
    gauge: {
      axis: { range: [null, 150] },
      steps: [
        { range: [0, 50], color: "lightgray" },
        { range: [50, 100], color: "gray" },
      ],
      threshold: {
        line: { color: "red", width: 4 },
        thickness: 0.75,
        value: 30,
      },
    },
  },
];

var layout = { width: 300, height: 250, margin: { t: 0, b: 0, l: 0, r: 0 } };

Plotly.newPlot(temperatureGaugeDiv, temperatureData, layout);
Plotly.newPlot(humidityGaugeDiv, humidityData, layout);
Plotly.newPlot(pressureGaugeDiv, pressureData, layout);
Plotly.newPlot(altitudeGaugeDiv, altitudeData, layout);

// Will hold the arrays we receive from our BME280 sensor
// Temperature
let newTempXArray = [];
let newTempYArray = [];
// Humidity
let newHumidityXArray = [];
let newHumidityYArray = [];
// Pressure
let newPressureXArray = [];
let newPressureYArray = [];
// Altitude
let newAltitudeXArray = [];
let newAltitudeYArray = [];

// The maximum number of data points displayed on our scatter/line graph
let MAX_GRAPH_POINTS = 12;
let ctr = 0;

// Callback function that will retrieve our latest sensor readings and redraw our Gauge with the latest readings
function updateSensorReadings() {
  fetch(`/sensorReadings`)
    .then((response) => response.json())
    .then((jsonResponse) => {
      let temperature = jsonResponse.temperature.toFixed(2);
      let humidity = jsonResponse.humidity.toFixed(2);
      let pressure = jsonResponse.pressure.toFixed(2);
      let altitude = jsonResponse.altitude.toFixed(2);

      updateBoxes(temperature, humidity, pressure, altitude);

      updateGauge(temperature, humidity, pressure, altitude);

      // Update Temperature Line Chart
      updateCharts(
        temperatureHistoryDiv,
        newTempXArray,
        newTempYArray,
        temperature
      );
      // Update Humidity Line Chart
      updateCharts(
        humidityHistoryDiv,
        newHumidityXArray,
        newHumidityYArray,
        humidity
      );
      // Update Pressure Line Chart
      updateCharts(
        pressureHistoryDiv,
        newPressureXArray,
        newPressureYArray,
        pressure
      );

      // Update Altitude Line Chart
      updateCharts(
        altitudeHistoryDiv,
        newAltitudeXArray,
        newAltitudeYArray,
        altitude
      );
    });
}

function updateBoxes(temperature, humidity, pressure, altitude) {
  let temperatureDiv = document.getElementById("temperature");
  let humidityDiv = document.getElementById("humidity");
  let pressureDiv = document.getElementById("pressure");
  let altitudeDiv = document.getElementById("altitude");

  temperatureDiv.innerHTML = temperature + " C";
  humidityDiv.innerHTML = humidity + " %";
  pressureDiv.innerHTML = pressure + " hPa";
  altitudeDiv.innerHTML = altitude + " m";
}

function updateGauge(temperature, humidity, pressure, altitude) {
  var temperature_update = {
    value: temperature,
  };
  var humidity_update = {
    value: humidity,
  };
  var pressure_update = {
    value: pressure,
  };
  var altitude_update = {
    value: altitude,
  };
  Plotly.update(temperatureGaugeDiv, temperature_update);
  Plotly.update(humidityGaugeDiv, humidity_update);
  Plotly.update(pressureGaugeDiv, pressure_update);
  Plotly.update(altitudeGaugeDiv, altitude_update);
}

function updateCharts(lineChartDiv, xArray, yArray, sensorRead) {
  if (xArray.length >= MAX_GRAPH_POINTS) {
    xArray.shift();
  }
  if (yArray.length >= MAX_GRAPH_POINTS) {
    yArray.shift();
  }
  xArray.push(ctr++);
  yArray.push(sensorRead);

  var data_update = {
    x: [xArray],
    y: [yArray],
  };

  Plotly.update(lineChartDiv, data_update);
}

// Continuos loop that runs evry 3 seconds to update our web page with the latest sensor readings
(function loop() {
  setTimeout(() => {
    updateSensorReadings();
    loop();
  }, 250);
})();

// --- Unified Camera & Gallery Functionality ---
const btnToggleStream = document.getElementById("btn-toggle-stream");
const btnCapturePhoto = document.getElementById("btn-capture-photo");
const btnToggleRecord = document.getElementById("btn-toggle-record");
const imgLiveStream = document.getElementById("img-live-stream");
const cameraOffText = document.getElementById("camera-off-text");
const recordingIndicator = document.getElementById("recording-indicator");
const galleryContainer = document.getElementById("gallery-container");

let isStreamOn = false;
let isRecording = false;

function updateButtonStates() {
  if (isStreamOn) {
    btnToggleStream.innerHTML = "<i class='bx bx-power-off'></i> Turn Off";
    btnToggleStream.style.background = "#6c757d";
    btnCapturePhoto.disabled = false;
    btnCapturePhoto.style.opacity = 1;
    btnToggleRecord.disabled = false;
    btnToggleRecord.style.opacity = 1;
    imgLiveStream.style.display = "block";
    cameraOffText.style.display = "none";
  } else {
    btnToggleStream.innerHTML = "<i class='bx bx-power-off'></i> Turn On";
    btnToggleStream.style.background = "#0A2558";
    btnCapturePhoto.disabled = true;
    btnCapturePhoto.style.opacity = 0.5;
    btnToggleRecord.disabled = true;
    btnToggleRecord.style.opacity = 0.5;
    imgLiveStream.style.display = "none";
    cameraOffText.style.display = "block";
  }
  
  if (isRecording) {
    btnToggleRecord.innerHTML = "<i class='bx bx-stop-circle'></i> Stop Record";
    btnToggleRecord.style.background = "#343a40";
    recordingIndicator.style.display = "block";
  } else {
    btnToggleRecord.innerHTML = "<i class='bx bx-video'></i> Start Record";
    btnToggleRecord.style.background = "#dc3545";
    recordingIndicator.style.display = "none";
  }
}

btnToggleStream.addEventListener("click", () => {
  isStreamOn = !isStreamOn;
  if (isStreamOn) {
    imgLiveStream.src = `/stream?t=${new Date().getTime()}`; // Bypass cache
  } else {
    imgLiveStream.src = "";
    if (isRecording) toggleRecord(); // Failsafe: stop recording if stream is killed
  }
  updateButtonStates();
});

btnCapturePhoto.addEventListener("click", () => {
  // Quick visual flash feedback for the shutter
  const originalBg = btnCapturePhoto.style.background;
  btnCapturePhoto.style.background = "#ffffff";
  setTimeout(() => btnCapturePhoto.style.background = originalBg, 150);

  fetch('/api/camera/capture', { method: 'POST' })
    .then(res => res.json())
    .then(data => { if (data.url) loadGallery(); });
});

function toggleRecord() {
  if (!isRecording) {
    fetch('/api/camera/record/start', { method: 'POST' }).then(() => {
      isRecording = true;
      updateButtonStates();
    });
  } else {
    fetch('/api/camera/record/stop', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        isRecording = false;
        updateButtonStates();
        if (data.url) loadGallery();
      });
  }
}

btnToggleRecord.addEventListener("click", toggleRecord);

function loadGallery() {
  fetch('/api/gallery')
    .then(res => res.json())
    .then(files => {
      galleryContainer.innerHTML = "";
      if (files.length === 0) {
        galleryContainer.innerHTML = "<p style='color: #666; width: 100%; text-align: center; font-style: italic; margin-top: 10px;'>No photos or videos yet.</p>";
        return;
      }
      
      files.forEach(file => {
        const itemDiv = document.createElement("div");
        itemDiv.style = "position: relative; min-width: 140px; height: 100px; border-radius: 8px; overflow: hidden; background: #ddd; box-shadow: 0 2px 5px rgba(0,0,0,0.2); flex-shrink: 0; border: 2px solid #fff;";
        
        let thumbHtml = file.type === "photo" 
          ? `<img src="${file.url}" style="width: 100%; height: 100%; object-fit: cover;" />`
          : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #333; color: #fff; font-size: 30px;"><i class='bx bx-video-recording'></i></div>`;
        
        itemDiv.innerHTML = `
          ${thumbHtml}
          <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.7); padding: 5px; display: flex; justify-content: space-around;">
            <a href="${file.url}" target="_blank" style="color: #fff; text-decoration: none; font-size: 18px; transition: 0.2s;" title="View in Browser"><i class='bx bx-show'></i></a>
            <a href="${file.url}" download="${file.name}" style="color: #fff; text-decoration: none; font-size: 18px; transition: 0.2s;" title="Download File"><i class='bx bx-download'></i></a>
          </div>
          ${file.type === "video" ? `<span style="position: absolute; top: 4px; left: 4px; color: #fff; font-size: 10px; background: red; padding: 2px 6px; border-radius: 4px; font-weight: bold;">VIDEO</span>` : ""}
        `;
        galleryContainer.appendChild(itemDiv);
      });
    });
}

// Initialize gallery on page load
loadGallery();

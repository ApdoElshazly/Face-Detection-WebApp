// Elements
const imageUpload = document.getElementById('imageUpload');
const inputImage = document.getElementById('inputImage');
const canvas = document.getElementById('overlay');
const statusDiv = document.getElementById('status');
const video = document.getElementById('video');
const startBtn = document.getElementById('startWebcam');
const stopBtn = document.getElementById('stopWebcam');

let modelsLoaded = false;
let stream = null;
let detecting = false;
let rafId = null;

// Status
statusDiv.textContent = "Loading AI models... Please wait ";

Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models')
]).then(() => {
  modelsLoaded = true;
  statusDiv.textContent = "Models loaded successfully! You can upload an image or start webcam.";
}).catch(err => {
  console.error("Error loading models:", err);
  statusDiv.textContent = "Error loading models.";
});

// Image upload detection
imageUpload.addEventListener('change', async () => {
  if (!modelsLoaded) return alert("Models still loading.");

  stopWebcamStream();

  const file = imageUpload.files[0];
  if (!file) return;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  inputImage.style.display = 'none';
  statusDiv.textContent = "Detecting faces...";

  const reader = new FileReader();
  reader.onload = () => inputImage.src = reader.result;
  reader.readAsDataURL(file);

  inputImage.onload = async () => {
    inputImage.style.display = 'block';
    video.style.display = 'none';

    canvas.width = inputImage.width;
    canvas.height = inputImage.height;

    const detections = await faceapi.detectAllFaces(inputImage);
    statusDiv.textContent = detections.length
      ? detections.length + " face(s) detected!"
      : "No faces detected.";

    const resized = faceapi.resizeResults(detections, {
      width: inputImage.width,
      height: inputImage.height
    });

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resized);
  };
});

// Webcam detection
async function startWebcamStream() {
  if (!modelsLoaded) return alert("Models still loading.");

  stopWebcamStream();

  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.style.display = 'block';
    inputImage.style.display = 'none';

    await new Promise(res => video.onloadedmetadata = res);

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    detecting = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;

    detectLoop();
  } catch {
    statusDiv.textContent = "Cannot access webcam.";
  }
}

function stopWebcamStream() {
  detecting = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;

  if (rafId) cancelAnimationFrame(rafId);

  if (stream) stream.getTracks().forEach(t => t.stop());
  video.srcObject = null;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  statusDiv.textContent = "Webcam stopped.";
}

async function detectLoop() {
  if (!detecting) return;

  rafId = requestAnimationFrame(detectLoop);

  if (video.readyState !== 4) return;

  const detections = await faceapi.detectAllFaces(video);

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (detections.length) {
    const resized = faceapi.resizeResults(detections, {
      width: video.videoWidth,
      height: video.videoHeight
    });

    faceapi.draw.drawDetections(canvas, resized);
    statusDiv.textContent = detections.length + " face(s) detected (live).";
  } else {
    statusDiv.textContent = "No faces detected (live).";
  }
}

startBtn.addEventListener('click', startWebcamStream);
stopBtn.addEventListener('click', stopWebcamStream);

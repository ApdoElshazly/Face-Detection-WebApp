const imageUpload = document.getElementById('imageUpload');
const inputImage = document.getElementById('inputImage');
const canvas = document.getElementById('overlay');
const statusDiv = document.getElementById('status');

let modelsLoaded = false;

statusDiv.textContent = "Loading AI models... Please wait ";

Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models')
]).then(() => {
  modelsLoaded = true;
  statusDiv.textContent = " Models loaded successfully! You can upload an image now.";
  console.log(" Models loaded successfully");
});

imageUpload.addEventListener('change', async () => {
  if (!modelsLoaded) {
    alert("Models are still loading. Please wait a few seconds.");
    return;
  }

  const file = imageUpload.files[0];
  if (!file) return;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  inputImage.style.display = 'none';
  statusDiv.textContent = " Detecting faces...";


  const reader = new FileReader();
  reader.onload = () => {
    inputImage.src = reader.result;
  };
  reader.readAsDataURL(file);

  inputImage.onload = async () => {
    inputImage.style.display = 'block';
    canvas.width = inputImage.width;
    canvas.height = inputImage.height;

    const detections = await faceapi.detectAllFaces(inputImage);

    if (detections.length === 0) {
      statusDiv.textContent = " No faces detected.";
      console.log(" No faces detected.");
      return;
    }

    statusDiv.textContent = ` ${detections.length} face(s) detected!`;
    console.log(` ${detections.length} face(s) detected`);

    const resizedDetections = faceapi.resizeResults(detections, inputImage);
    faceapi.draw.drawDetections(canvas, resizedDetections);
  };
});

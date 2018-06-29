// https://immersive-web.github.io/webxr/#xrdevicepose-interface



// If requested, initialize the WebXR polyfill
// if (QueryArgs.getBool('allowPolyfill', false)) {
//   var polyfill = new WebXRPolyfill();
// }
// Apply the version shim after the polyfill is instantiated, to ensure
// that the polyfill also gets patched if necessary.
// var versionShim = new WebXRVersionShim();
let useReticle = document.getElementById('useReticle');
// XR globals.
let xrButton = null;
let xrFrameOfRef = null;
// WebGL scene globals.
let gl = null;
let renderer = null;
let scene = new Scene();
scene.enableStats(false);


let arObject = new Node();
arObject.visible = false;
scene.addNode(arObject);
let flower = new Gltf2Node({url: './sunflower/sunflower.gltf'});
arObject.addNode(flower);
// Having a really simple drop shadow underneath an object helps ground
// it in the world without adding much complexity.
let shadow = new DropShadowNode();
vec3.set(shadow.scale, 0.15, 0.15, 0.15);
arObject.addNode(shadow);
const MAX_FLOWERS = 30;
let flowers = [];
window.flowers = flowers;
// Ensure the background is transparent for AR.
scene.clear = false;
function initXR() {
  xrButton = new XRDeviceButton({
    onRequestSession: onRequestSession,
    onEndSession: onEndSession,
    textEnterXRTitle: "START AR",
    textXRNotFoundTitle: "AR NOT FOUND",
    textExitXRTitle: "EXIT  AR",
  });
  document.querySelector('header').appendChild(xrButton.domElement);
  if (navigator.xr) {
    navigator.xr.requestDevice().then((device) => {
      console.log('device', device);
      // TODO: supportsSession call for AR.
      //device.supportsSession({ar: true}).then(() => {
      xrButton.setDevice(device);
      //});
    });
  }
}
function onRequestSession(device) {
  let outputCanvas = document.createElement('canvas');
  outputCanvas.setAttribute('id', 'output-canvas');
  let ctx = outputCanvas.getContext('xrpresent');
  device.requestSession({ exclusive: false, requestAR: true, outputContext: ctx })
    .then((session) => {
      console.log('session', session);
      // Add the canvas to the document once we know that it will be
      // rendered to.
      document.body.appendChild(outputCanvas);
      xrButton.setSession(session);
      onSessionStarted(session);
    });
}
function onSessionStarted(session) {
  session.addEventListener('end', onSessionEnded);
  session.addEventListener('select', onSelect);
  if (!gl) {
    gl = createWebGLContext({
      compatibleXRDevice: session.device
    });
    renderer = new Renderer(gl);
    scene.setRenderer(renderer);
  }
  session.baseLayer = new XRWebGLLayer(session, gl);
  session.requestFrameOfReference('eye-level').then((frameOfRef) => {
    xrFrameOfRef = frameOfRef;
    session.requestAnimationFrame(onXRFrame);
  });
}
function onEndSession(session) {
  session.end();
  // Remove the injected output canvas from the DOM.
  document.body.removeChild(document.querySelector('#output-canvas'));
}
function onSessionEnded(event) {
  xrButton.setSession(null);
}
// Adds a new object to the scene at the
// specificed transform.
function addARObjectAt(matrix) {
  let newFlower = arObject.clone();
  newFlower.visible = true;
  newFlower.matrix = matrix;
  // newFlower.translation = [0, 0, 0];
  scene.addNode(newFlower);
  flowers.push(newFlower);
  // For performance reasons if we add too many objects start
  // removing the oldest ones to keep the scene complexity
  // from growing too much.
  if (flowers.length > MAX_FLOWERS) {
    let oldFlower = flowers.shift();
    scene.removeNode(oldFlower);
  }
}
let rayOrigin = vec3.create();
let rayDirection = vec3.create();

let lastTouchTime = Date.now();
let isFired = false;

function onSelect(event) {
  console.log('session onselect', event);
  const isDoubleTap = Date.now() - lastTouchTime < 1000;
  console.log(isDoubleTap);
  if (isDoubleTap) {
    isFired = true;
  }
  lastTouchTime = Date.now();

  if (useReticle.checked && arObject.visible) {
    // If we're using the reticle then we've already got a mesh positioned
    // at the latest hit point and we should just use it's matrix to save
    // an unnecessary requestHitTest call.
    addARObjectAt(arObject.matrix);
  } else {
    // Otherwise we'll use the target ray from the input source that generated
    // this event to fire off a new hit test.
    let inputPose = event.frame.getInputPose(event.inputSource, xrFrameOfRef);
    if (!inputPose) {
      return;
    }
    if (inputPose.targetRayMatrix) {
      vec3.set(rayOrigin, 0, 0, 0);
      vec3.transformMat4(rayOrigin, rayOrigin, inputPose.targetRayMatrix);
      vec3.set(rayDirection, 0, 0, -1);
      vec3.transformMat4(rayDirection, rayDirection, inputPose.targetRayMatrix);
      vec3.sub(rayDirection, rayDirection, rayOrigin);
      vec3.normalize(rayDirection, rayDirection);
      event.frame.session.requestHitTest(rayOrigin, rayDirection, xrFrameOfRef).then((results) => {
        if (results.length) {
          addARObjectAt(results[0].hitMatrix);
        }
      });
    }
  }
}

// Called every time a XRSession requests that a new frame be drawn.
function onXRFrame(t, frame) {
  // console.log(flowers);
  let session = frame.session;
  let pose = frame.getDevicePose(xrFrameOfRef);
  // If requested, use the pose to cast a reticle into the scene using a
  // continuous hit test. For the moment we're just using the flower
  // as the "reticle".
  if (useReticle.checked && pose && pose.poseModelMatrix) {
    vec3.set(rayOrigin, 0, 0, 0);
    vec3.transformMat4(rayOrigin, rayOrigin, pose.poseModelMatrix);
    vec3.set(rayDirection, 0, 0, -1);
    vec3.transformMat4(rayDirection, rayDirection, pose.poseModelMatrix);
    vec3.sub(rayDirection, rayDirection, rayOrigin);
    vec3.normalize(rayDirection, rayDirection);
    session.requestHitTest(rayOrigin, rayDirection, xrFrameOfRef).then((results) => {
      // When the hit test returns use it to place our proxy object.
      if (results.length) {
        // console.log(results);
        let hitResult = results[0];
        arObject.visible = true;
        arObject.matrix = hitResult.hitMatrix;
      } else {
        arObject.visible = false;
      }
    });
  } else {
    arObject.visible = false;
  }

  if (isFired) {
    // console.log(flowers);
    flowers.forEach(flower => {
      flower.rotation[1] = flower.rotation[1] + 0.1;
    });
  }

  scene.startFrame();
  session.requestAnimationFrame(onXRFrame);
  scene.drawXRFrame(frame, pose);
  scene.endFrame();
}

// Start the XR application.
initXR();

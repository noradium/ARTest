/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("// If requested, initialize the WebXR polyfill\n// if (QueryArgs.getBool('allowPolyfill', false)) {\n//   var polyfill = new WebXRPolyfill();\n// }\n// Apply the version shim after the polyfill is instantiated, to ensure\n// that the polyfill also gets patched if necessary.\n// var versionShim = new WebXRVersionShim();\nlet useReticle = document.getElementById('useReticle');\n// XR globals.\nlet xrButton = null;\nlet xrFrameOfRef = null;\n// WebGL scene globals.\nlet gl = null;\nlet renderer = null;\nlet scene = new Scene();\nscene.enableStats(false);\n\n\nlet arObject = new Node();\narObject.visible = false;\nscene.addNode(arObject);\nlet flower = new Gltf2Node({url: './sunflower/sunflower.gltf'});\narObject.addNode(flower);\n// Having a really simple drop shadow underneath an object helps ground\n// it in the world without adding much complexity.\nlet shadow = new DropShadowNode();\nvec3.set(shadow.scale, 0.15, 0.15, 0.15);\narObject.addNode(shadow);\nconst MAX_FLOWERS = 30;\nlet flowers = [];\nwindow.flowers = flowers;\n// Ensure the background is transparent for AR.\nscene.clear = false;\nfunction initXR() {\n  xrButton = new XRDeviceButton({\n    onRequestSession: onRequestSession,\n    onEndSession: onEndSession,\n    textEnterXRTitle: \"START AR\",\n    textXRNotFoundTitle: \"AR NOT FOUND\",\n    textExitXRTitle: \"EXIT  AR\",\n  });\n  document.querySelector('header').appendChild(xrButton.domElement);\n  if (navigator.xr) {\n    navigator.xr.requestDevice().then((device) => {\n      console.log('device', device);\n      // TODO: supportsSession call for AR.\n      //device.supportsSession({ar: true}).then(() => {\n      xrButton.setDevice(device);\n      //});\n    });\n  }\n}\nfunction onRequestSession(device) {\n  let outputCanvas = document.createElement('canvas');\n  outputCanvas.setAttribute('id', 'output-canvas');\n  let ctx = outputCanvas.getContext('xrpresent');\n  device.requestSession({ exclusive: false, requestAR: true, outputContext: ctx })\n    .then((session) => {\n      console.log('session', session);\n      // Add the canvas to the document once we know that it will be\n      // rendered to.\n      document.body.appendChild(outputCanvas);\n      xrButton.setSession(session);\n      onSessionStarted(session);\n    });\n}\nfunction onSessionStarted(session) {\n  session.addEventListener('end', onSessionEnded);\n  session.addEventListener('select', onSelect);\n  if (!gl) {\n    gl = createWebGLContext({\n      compatibleXRDevice: session.device\n    });\n    renderer = new Renderer(gl);\n    scene.setRenderer(renderer);\n  }\n  session.baseLayer = new XRWebGLLayer(session, gl);\n  session.requestFrameOfReference('eye-level').then((frameOfRef) => {\n    xrFrameOfRef = frameOfRef;\n    session.requestAnimationFrame(onXRFrame);\n  });\n}\nfunction onEndSession(session) {\n  session.end();\n  // Remove the injected output canvas from the DOM.\n  document.body.removeChild(document.querySelector('#output-canvas'));\n}\nfunction onSessionEnded(event) {\n  xrButton.setSession(null);\n}\n// Adds a new object to the scene at the\n// specificed transform.\nfunction addARObjectAt(matrix) {\n  let newFlower = arObject.clone();\n  newFlower.visible = true;\n  newFlower.matrix = matrix;\n  // newFlower.translation = [0, 0, 0];\n  scene.addNode(newFlower);\n  flowers.push(newFlower);\n  // For performance reasons if we add too many objects start\n  // removing the oldest ones to keep the scene complexity\n  // from growing too much.\n  if (flowers.length > MAX_FLOWERS) {\n    let oldFlower = flowers.shift();\n    scene.removeNode(oldFlower);\n  }\n}\nlet rayOrigin = vec3.create();\nlet rayDirection = vec3.create();\n\nlet lastTouchTime = Date.now();\nlet isFired = false;\n\nfunction onSelect(event) {\n  console.log('session onselect', event);\n  const isDoubleTap = Date.now() - lastTouchTime < 1000;\n  console.log(isDoubleTap);\n  if (isDoubleTap) {\n    isFired = true;\n  }\n  lastTouchTime = Date.now();\n\n  if (useReticle.checked && arObject.visible) {\n    // If we're using the reticle then we've already got a mesh positioned\n    // at the latest hit point and we should just use it's matrix to save\n    // an unnecessary requestHitTest call.\n    addARObjectAt(arObject.matrix);\n  } else {\n    // Otherwise we'll use the target ray from the input source that generated\n    // this event to fire off a new hit test.\n    let inputPose = event.frame.getInputPose(event.inputSource, xrFrameOfRef);\n    if (!inputPose) {\n      return;\n    }\n    if (inputPose.targetRayMatrix) {\n      vec3.set(rayOrigin, 0, 0, 0);\n      vec3.transformMat4(rayOrigin, rayOrigin, inputPose.targetRayMatrix);\n      vec3.set(rayDirection, 0, 0, -1);\n      vec3.transformMat4(rayDirection, rayDirection, inputPose.targetRayMatrix);\n      vec3.sub(rayDirection, rayDirection, rayOrigin);\n      vec3.normalize(rayDirection, rayDirection);\n      event.frame.session.requestHitTest(rayOrigin, rayDirection, xrFrameOfRef).then((results) => {\n        if (results.length) {\n          addARObjectAt(results[0].hitMatrix);\n        }\n      });\n    }\n  }\n}\n\n// Called every time a XRSession requests that a new frame be drawn.\nfunction onXRFrame(t, frame) {\n  // console.log(flowers);\n  let session = frame.session;\n  let pose = frame.getDevicePose(xrFrameOfRef);\n  // If requested, use the pose to cast a reticle into the scene using a\n  // continuous hit test. For the moment we're just using the flower\n  // as the \"reticle\".\n  if (useReticle.checked && pose && pose.poseModelMatrix) {\n    vec3.set(rayOrigin, 0, 0, 0);\n    vec3.transformMat4(rayOrigin, rayOrigin, pose.poseModelMatrix);\n    vec3.set(rayDirection, 0, 0, -1);\n    vec3.transformMat4(rayDirection, rayDirection, pose.poseModelMatrix);\n    vec3.sub(rayDirection, rayDirection, rayOrigin);\n    vec3.normalize(rayDirection, rayDirection);\n    session.requestHitTest(rayOrigin, rayDirection, xrFrameOfRef).then((results) => {\n      // When the hit test returns use it to place our proxy object.\n      if (results.length) {\n        // console.log(results);\n        let hitResult = results[0];\n        arObject.visible = true;\n        arObject.matrix = hitResult.hitMatrix;\n      } else {\n        arObject.visible = false;\n      }\n    });\n  } else {\n    arObject.visible = false;\n  }\n\n  if (isFired) {\n    // console.log(flowers);\n    flowers.forEach(flower => {\n      flower.rotation[1] = flower.rotation[1] + 0.1;\n    });\n  }\n\n  scene.startFrame();\n  session.requestAnimationFrame(onXRFrame);\n  scene.drawXRFrame(frame, pose);\n  scene.endFrame();\n}\n\n// Start the XR application.\ninitXR();\n\n\n//# sourceURL=webpack:///./src/index.js?");

/***/ })

/******/ });
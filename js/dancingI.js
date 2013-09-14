// dancingI.js (c) 2013 yusuf sobh
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'varying vec4 v_Color;\n' +

  'uniform mat4 u_ModelMatrix;\n' +
  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '  gl_PointSize = 10.0;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';


  // Indices of the vertices for a line strip
  var lineStripIndices = new Uint8Array([
   0, 1, 2, 0,
   9, 10, 11, 9,
   0, 9, 11, 0,
   0, 2, 9, 0,
   0, 2, 3, 4,
   4, 3, 5, 4,
   5, 3, 6, 5, 4,
   8, 7, 6, 8,
   3, 8, 6, 3,
   2, 9, 8, 2,
   2, 3, 8,
 ]);

  // Indices of the vertices for triangles
  var regularIndices = new Uint8Array([
   0, 1, 2,
   9, 10, 11,
   0, 9, 11,
   0, 2, 9,
   4, 3, 5,
   5, 3, 6,
   8, 7, 6,
   3, 8, 6,
   2, 9, 8,
   2, 3, 8,
 ]);

  var vertices = new Float32Array ([
  -0.6, 1.0,
  -0.6, 0.6,
  -0.2, 0.6,
  -0.2, -0.6,
  -0.6, -0.6,
  -0.6, -1.0,
  0.6, -1.0,
  0.6, -0.6,
  0.2, -0.6, 
  0.2, 0.6,
  0.6, 0.6,
  0.6, 1.0
  ]);

  var originalVertices = new Float32Array ([
  -0.6, 1.0,
  -0.6, 0.6,
  -0.2, 0.6,
  -0.2, -0.6,
  -0.6, -0.6,
  -0.6, -1.0,
  0.6, -1.0,
  0.6, -0.6,
  0.2, -0.6, 
  0.2, 0.6,
  0.6, 0.6,
  0.6, 1.0
  ]);

// Rotation speed (degrees/second)
var ANGLE_STEP = 180.0;
var SHOW_MESH = false;

// We need to update buffers constantly so I give them global access.
var positionBuffer;
var colorBuffer;
var indexBuffer;

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  //Handle keypresses
  document.onkeydown = function(ev) {keydown(ev);};

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);

  // Initialize shaders
  initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)

  // Write the positions of vertices to a vertex shader
  var n = initBuffers(gl);

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Get storage location of u_ModelMatrix
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');

// Model matrix
  var modelMatrix = new Matrix4();

  // Current angle for circle movement
  var currentAngle = 0.0;

  var analyser = setupAudio();
  var frequencyData = new Uint8Array(analyser.frequencyBinCount);

  // Start drawing
  var update = function() {
    
    var musicFrequency = getAverageMusicFrequency(analyser, frequencyData);

    currentAngle = animate(currentAngle);  // Update the angle

    draw(gl, n, currentAngle, modelMatrix, u_ModelMatrix, musicFrequency);   // Draw the triangle

    requestAnimationFrame(update, canvas); // Request that the browser calls update again
  };

  //Kick off the updating
  update();
}

function initBuffers(gl) {

  var colors = new Float32Array([     // Colors
    0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  1.0, 0.5, 0.0,  1.0, 0.5, 0.0,  // v0-v1-v2-v3 front(blue)
    0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  // v0-v3-v4-v5 right(green)
    1.0, 0.5, 0.0,  1.0, 0.5, 0.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0  // v0-v5-v6-v1 up(red)
  ]);

  //Creates our position buffer
  positionBuffer =  createArrayBuffer(gl, vertices, 2, gl.FLOAT, 'a_Position');
  colorBuffer =  createArrayBuffer(gl, colors, 3, gl.FLOAT, 'a_Color');

  // Create index buffer object
  indexBuffer = gl.createBuffer();
  
  return regularIndices.length;
}

function createArrayBuffer(gl, data, num, type, attribute) {
  var buffer = gl.createBuffer();   // Create a buffer object

  // Bind the buffer to gl
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  // Write data into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);

  // Point the attribute
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);

  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  return buffer;
}

function draw(gl, n, currentAngle, modelMatrix, u_ModelMatrix, musicData) {

  // Start with a blank identity matrix
  modelMatrix.setIdentity();

  // Scale the I according to the music frequency
  modelMatrix.scale(0.5 + musicData/2,0.5 + musicData/2,1.0);
 
  // Pass the matrix to the vertex shader
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  //Make the I move in a circle
  for (var i = 0; i < vertices.length; i+=2) {
    vertices[i] = originalVertices[i] + Math.cos((i/2 + currentAngle)*(Math.PI/180))/2;
    vertices[i+1] = originalVertices[i+1] + Math.sin((i/2 +currentAngle)*(Math.PI/180))/2;
  };

  // re-bind the buffer to gl so we can use it.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Send the newly updated vertices to the buffer
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Draw the I as a line-strip
  if(SHOW_MESH) {
      //Re-bind the index buffer so we can use it
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      //Send the line-strip indices to the buffer
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, lineStripIndices, gl.DYNAMIC_DRAW);
      //Finally draw our line-strip according to indices
      gl.drawElements(gl.LINE_STRIP, lineStripIndices.length, gl.UNSIGNED_BYTE, 0);
  } else {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, regularIndices, gl.DYNAMIC_DRAW);
      gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
  }
}

// Last time that this function was called
var g_last = Date.now();
function animate(angle) {
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  // Update the current rotation angle (adjusted by the elapsed time)
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return newAngle %= 360;
}

function setupAudio() {
  var context = new webkitAudioContext();
  var analyser = context.createAnalyser();

  var audioElement = document.getElementById("player");

  audioElement.addEventListener("canplay", function() {
    var source = context.createMediaElementSource(audioElement);
    source.connect(analyser);
    analyser.connect(context.destination);
    analyser.fftSize = 1024;
  });

  return analyser;
}

function getAverageMusicFrequency(analyser, frequencyData) {
   
    analyser.getByteFrequencyData(frequencyData);    // Get the new frequency data

    var length = frequencyData.length;
    var sum = 0;
    for (var i = 0; i < length; i++) {
      sum += frequencyData[i];
    };
    var average = sum / length;
    var musicData = average / 128;

    return musicData;
}


function keydown(ev) {
    if(ev.keyCode == 39) { // The right arrow key was pressed
      SHOW_MESH = true;
    } else if (ev.keyCode == 37) { // The left arrow key was pressed
      SHOW_MESH = false;
    }    
}

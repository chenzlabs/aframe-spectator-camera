// Add style.
document.querySelector('head').insertAdjacentHTML('beforeend',
  '<style>' 
  + '.absolutely-fullscreen {' 
  + 'width: 100% !important; height: 100% !important;' 
  + 'top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;' 
  + 'z-index: 999999 !important; position: fixed !important;'
  + '}'
  + '</style>');

// Add spectator component to go with camera.
AFRAME.registerComponent('spectator', {
  schema: {
    // Selector for container of spectator canvas.
    container: {type: 'selector', default: '#spectator'},
    // Desired FPS of spectator display.
    fps: {type: 'number', default: 30},
    // Allowed slop in timings for FPS computation.
    slopMsec: {type: 'number', default: 1},
    // Auto-disable active camera wasd-controls (so it only moves spectator).
    disableActiveCameraWasdControls: {type: 'boolean', default: false}
  },

  fixCamera: function () {
    var cam = this.el.components.camera.camera;
    var size = this.renderer.getSize();
    cam.aspect = size.width / size.height;
    cam.updateProjectionMatrix();          
  },
  
  removeLookControlsListenersAndFixCamera: function () {
    var lookControls = this.el.components['look-controls'];
    lookControls.removeEventListeners();

    this.fixCamera();
  },

  init: function() {
    this.removeLookControlsListenersAndFixCamera = this.removeLookControlsListenersAndFixCamera.bind(this);
    var targetEl = this.data.container;
    var self = this;

    this.el.setAttribute('camera', 'active', false);
    this.el.setAttribute('look-controls', 'hmdEnabled', false);

    // Create separate spectator renderer and canvas.
    this.renderer = new THREE.WebGLRenderer( { antialias: true } );
    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.renderer.setSize(targetEl.offsetWidth, targetEl.offsetHeight);

    // doesn't seem to do anything...

    // Attach spectator canvas to specified element.
    // FIXME: aspect ratio doesn't match
    targetEl.appendChild(this.renderer.domElement);

    var lookControls = this.el.components['look-controls'];

    // Event listeners may have been added this tick,
    // so remove them next tick.
    setTimeout(this.removeLookControlsListenersAndFixCamera);

    // We would just remove event listeners for the main canvas, 
    // but then render-target-loaded would add them.
    // We can't remove the event listener because it uses a bind.
    // So unhook them the tick after they get added (bleah).
    this.el.sceneEl.addEventListener('render-target-loaded', function () { 
        setTimeout(self.removeLookControlsListenersAndFixCamera);
    });

    // Attach look-controls handlers to spectator.
    targetEl.addEventListener('mousedown', function (e) {
      lookControls.onMouseDown(e); 
    }, false);

    var self = this;
    this.el.sceneEl.addEventListener('camera-set-active', function (e) {
      if (!self.data.disableActiveCameraWasdControls) { return; }
      // Detach wasd-controls on the active camera,
      // assuming that we want to move the spectator instead.
      e.detail.cameraEl.setAttribute('wasd-controls', 'enabled', false);
    });

    var self = this;
    this.el.sceneEl.addEventListener('enter-vr', function (e) {
      // Don't show the in-VR canvas on screen.
      e.target.canvas.classList.add('a-hidden');

      // Make the spectator container and canvas fullscreen.
      // NOTE: need to undo this targetEl style change later!
      targetEl.classList.add('absolutely-fullscreen');
      self.renderer.setSize(screen.width, screen.height);
      self.fixCamera();
    });
    this.el.sceneEl.addEventListener('exit-vr', function (e) {
      // Show the in-VR canvas on screen.
      e.target.canvas.classList.remove('a-hidden');

      // Make the spectator container and canvas normal again.
      targetEl.classList.remove('absolutely-fullscreen');
      self.renderer.setSize(targetEl.offsetWidth, targetEl.offsetHeight );
      self.fixCamera();
    });
  },

  tick: function (t, dt) {
    if (this.lastRendered && (t - this.lastRendered < (1000.0 / this.data.fps) - this.data.slopMsec)) { return; }

    this.render(t - (this.lastRendered || 0));
    this.lastRendered = t;  
  },

  render: function () {
    this.renderer.render(this.el.sceneEl.object3D, this.el.object3DMap.camera);
  }
});

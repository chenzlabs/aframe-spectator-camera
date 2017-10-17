AFRAME.registerComponent('controller-cursor', {
  dependencies: ['cursor'],

  // daydream-controller doesn't have a trigger.
  schema: {
    downEvents: { type: 'array', default: ['triggerdown', 'trackpaddown']},
    upEvents: { type: 'array', default: ['triggerup', 'trackpadup']},
  },

  init: function () {
    this.onDown = this.onDown.bind(this);
    this.onUp = this.onUp.bind(this);
  },

  play: function () {
    var el = this.el;
    this.data.downEvents.forEach((eventName) => {
      el.addEventListener(eventName, this.onDown);
    });
    this.data.upEvents.forEach((eventName) => {
      el.addEventListener(eventName, this.onUp);
    });
  },

  pause: function () {
    var el = this.el;
    this.data.downEvents.forEach((eventName) => {
      el.removeEventListener(eventName, this.onDown);
    });
    this.data.upEvents.forEach((eventName) => {
      el.removeEventListener(eventName, this.onUp);
    });
  },

  onDown: function (evt) { this.el.components.cursor.onMouseDown(); },
  onUp: function (evt) { this.el.components.cursor.onMouseUp(); },
});

AFRAME.registerComponent('which-controller-present', {
  init: function () {
    this.el.addEventListener('componentinitialized', (function (evt) {
      if (evt.detail.name !== 'tracked-controls') { return; }
      // Determine which, if any, higher level controller component says controllerPresent.
      // WARNING!  If a dummy tracked-controls instance is already present,
      // then componentinitialized may not fire for true injection!
      Object.keys(this.el.components).forEach((name) => {
        const component = this.el.components[name];
        if (component.controllerPresent) {
          // Log name, component data, and tracked-controls data.
          console.log(name + ' ' +  JSON.stringify(component.data) + ' => ' + JSON.stringify(event.detail.data));

          // Emit controllerpresent event.
          this.el.emit('controllerpresent', {name: name, component: component});
        }
      });
    }).bind(this));
  }
});

AFRAME.registerComponent('selecting', {
  init: function () {
    this.oldColor = this.el.getAttribute('material').color;
    this.el.setAttribute('material','color','#4F4'); 
  },
  remove: function () {
    if (!this.oldColor) { return; }
    this.el.setAttribute('material', 'color', this.oldColor); 
  }
});

AFRAME.registerComponent('selected', {
  init: function () {
    this.oldColor = this.el.getAttribute('material').color;
    this.el.setAttribute('material','color','#48F'); 
  },
  remove: function () {
    if (!this.oldColor) { return; }
    this.el.setAttribute('material', 'color', this.oldColor); 
  }
});

AFRAME.registerComponent('clickable', {
  init: function () { this.el.classList.add('clickable'); },
  remove: function () { this.el.classList.remove('clickable'); }
});

AFRAME.registerComponent('clickbait', {
  dependencies: ['clickable'],

  init: function () {
    var el = this.el;

    el.addEventListener('mouseenter', function (evt) {
      console.log('mouseenter ' + JSON.stringify(evt.target.getAttribute('position')));
      evt.target.removeAttribute('selected'); 
      evt.target.setAttribute('selecting', '');
    });

    el.addEventListener('mouseleave', function (evt) {
      console.log('mouseleave ' + JSON.stringify(evt.target.getAttribute('position')));
      evt.target.removeAttribute('selecting'); 
      evt.target.removeAttribute('selected'); 
    });

    el.addEventListener('click', function (evt) {
      console.log('click ' + JSON.stringify(evt.target.getAttribute('position')));
      evt.target.removeAttribute('selecting'); 
      evt.target.setAttribute('selected', '');         
    });
  }
});

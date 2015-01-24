'use strict';

var _ = require('lodash');

module.exports = DotaControls;

/**
 * @exports threearena/controls/dota
 * 
 * @constructor
 */
function DotaControls ( object, domElement, options ) {

  this.object = object;

  var bind = function ( scope, fn ) {
    return function () {
      fn.apply( scope, arguments );
    };
  };

  this.options = _.merge({

    activeBorderZoneFactor: 0, // % of screen size
    activeBorderZoneTime: 300, // ms in the active border zone

  }, options);

  this.domElement = ( domElement !== undefined ) ? domElement : document;
  if ( domElement ) { this.domElement.setAttribute( 'tabindex', -1 ); }

  // API
  this.enabled = true;
  this.mouseEnabled = true;
  this.noZoom = false;

  this.movementSpeed = 100.0;
  this.rollSpeed = 0.005;

  this.dragToLook = false;
  this.autoForward = false;

  this.clamp = {
    xmin: -1000,
    xmax:  1000,
    zmin: -1000,
    zmax:  1000,
  };

  // disable default target object behavior

  // internals

  this._inActiveZone = { right:0, left:0, forward:0, backward:0 };
  this._keyboardHasFocus = false;

  this.tmpQuaternion = new THREE.Quaternion();

  this.mouseStatus = 0;


  this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };
  this.moveState = { up: 0, down: 0, left: 0, right: 0, forward: 0, back: 0, pitchUp: 0, pitchDown: 0, yawLeft: 0, yawRight: 0, rollLeft: 0, rollRight: 0 };
  this.moveVector = new THREE.Vector3( 0, 0, 0 );
  this.rotationVector = new THREE.Vector3( 0, 0, 0 );

  ////////////////

  this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );

  this.domElement.addEventListener( 'mousemove', bind( this, this.mousemove ), false );
  // this.domElement.addEventListener( 'mousewheel', bind( this, this.mousewheel ), false );
  // this.domElement.addEventListener( 'DOMMouseScroll', bind( this, this.mousewheel ), false ); // firefox

  this.domElement.addEventListener( 'keydown', bind( this, this.keydown ), false );
  this.domElement.addEventListener( 'keyup',   bind( this, this.keyup ), false );

  this.updateMovementVector();
  this.updateRotationVector();

  this.tmpQuaternion.set( -0.4, 0, 0, 1 ).normalize();
  this.object.quaternion.multiply( this.tmpQuaternion );
}

DotaControls.prototype.keydown = function( event ) {

  this._keyboardHasFocus = true;

  switch ( event.keyCode ) {

    case 16: /* shift */
      this.movementSpeedMultiplier = 0.1;
      break;

    case 37:
      this.moveState.left = 1;
      break;

    case 39:
      this.moveState.right = 1;
      break;

    case 38:
      this.moveState.forward = 1;
      break;

    case 40:
      this.moveState.back = 1;
      break;
  }

  this.updateMovementVector();
  this.updateRotationVector();

};

DotaControls.prototype.keyup = function( event ) {

  this._keyboardHasFocus = false;

  switch( event.keyCode ) {

    case 16: /* shift */
      this.movementSpeedMultiplier = 1;
      break;

    case 37:
      this.moveState.left = 0;
      break;

    case 39:
      this.moveState.right = 0;
      break;

    case 38:
      this.moveState.forward = 0;
      break;

    case 40:
      this.moveState.back = 0;
      break;
  }

  this.updateMovementVector();
  this.updateRotationVector();

};

DotaControls.prototype.mousedown = function( event ) {

  if ( this.domElement !== document ) {

    this.domElement.focus();

  }

  event.preventDefault();
  event.stopPropagation();

  if ( this.dragToLook ) {

    this.mouseStatus ++;

  } else {

    switch ( event.button ) {

      case 0:
        this.moveState.forward = 1;
        break;

      case 2:
        this.moveState.back = 1;
        break;
    }

    this.updateMovementVector();

  }

};

DotaControls.prototype.mousewheel = function( ) {
  this.moveVector.y += 0.01;
};

DotaControls.prototype.mousemove = function( event ) {

  var container = this.getContainerDimensions();

  // if (this._keyboardHasFocus) return;

  /*
  if (event.pageX < container.size[ 0 ] / 100 * this.hudZoneFactor) {

    this.hud.open();
    this.enabled = false;
    return;

  } else if ( this.hud.isOpen() ) {

    this.hud.close();
    this.enabled = true;
  }
  */

  if ( this.enabled && this.mouseEnabled && this.options.activeBorderZoneFactor) {

    var now = (new Date()).getTime();

    var activeZoneWidth  = container.size[ 0 ] / 100 * this.options.activeBorderZoneFactor;
    var activeZoneHeight = container.size[ 1 ] / 100 * this.options.activeBorderZoneFactor;

    if (event.pageX > container.size[ 0 ] - activeZoneWidth) {

      this._inActiveZone.right = this._inActiveZone.right || now;
      if (now - this._inActiveZone.right > this.options.activeBorderZoneTime) {
        this.moveState.right = 1;
      }

    } else {
      this._inActiveZone.right= 0;
      this.moveState.right = 0;
    }

    if (event.pageX < activeZoneWidth) {

      this._inActiveZone.left = this._inActiveZone.left || now;
      if (now - this._inActiveZone.left > this.options.activeBorderZoneTime) {
        this.moveState.left = 1;
      }

    } else {
      this._inActiveZone.left = 0;
      this.moveState.left = 0;
    }

    if (event.pageY < activeZoneHeight) {

      this._inActiveZone.forward = this._inActiveZone.forward || now;
      if (now - this._inActiveZone.forward > this.options.activeBorderZoneTime) {
        this.moveState.forward = 1;
      }

    } else {
      this._inActiveZone.forward = 0;
      this.moveState.forward = 0;
    }

    if (event.pageY > container.size[ 1 ] - activeZoneHeight - 200 /* FIXME crappy hack */) {

      this._inActiveZone.backward = this._inActiveZone.backward || now;
      if (now - this._inActiveZone.backward > this.options.activeBorderZoneTime) {
        this.moveState.back = 1;
      }

    } else {
      this._inActiveZone.backward = 0;
      this.moveState.back = 0;
    }

    this.updateMovementVector();
  }
};

DotaControls.prototype.mouseup = function( event ) {

  event.preventDefault();
  event.stopPropagation();

  if ( this.dragToLook ) {

    this.mouseStatus--;

    this.moveState.yawLeft = this.moveState.pitchDown = 0;

  } else {

  }
};

DotaControls.prototype.update = function( delta ) {

  if ( this.enabled ) {
    var moveMult = delta * this.movementSpeed;
    var rotMult = delta * this.rollSpeed;

    this.object.translateX( this.moveVector.x * moveMult );
    this.object.translateY( this.moveVector.y * moveMult );
    this.object.translateZ( this.moveVector.z * moveMult );

    if (this.object.position.x < this.clamp.xmin) { this.object.position.x = this.clamp.xmin; }
    if (this.object.position.x > this.clamp.xmax) { this.object.position.x = this.clamp.xmax; }
    if (this.object.position.z < this.clamp.zmin) { this.object.position.z = this.clamp.zmin; }
    if (this.object.position.z > this.clamp.zmax) { this.object.position.z = this.clamp.zmax; }

    this.tmpQuaternion.set( this.rotationVector.x * rotMult, this.rotationVector.y * rotMult, this.rotationVector.z * rotMult, 1 ).normalize();
    this.object.quaternion.multiply( this.tmpQuaternion );

    // expose the rotation vector for convenience
    this.object.rotation.setFromQuaternion( this.object.quaternion, this.object.rotation.order );
  }
};

DotaControls.prototype.updateMovementVector = function() {

  var forward = ( this.moveState.forward || ( this.autoForward && !this.moveState.back ) ) ? 1 : 0;

  this.moveVector.x = ( -this.moveState.left    + this.moveState.right );
  this.moveVector.y = ( -this.moveState.down    + this.moveState.up );
  this.moveVector.z = ( -forward + this.moveState.back );

  // console.log( 'move:', [ this.moveVector.x, this.moveVector.y, this.moveVector.z ] );

};

DotaControls.prototype.updateRotationVector = function() {

  this.rotationVector.x = ( -this.moveState.pitchDown + this.moveState.pitchUp );
  this.rotationVector.y = ( -this.moveState.yawRight  + this.moveState.yawLeft );
  this.rotationVector.z = ( -this.moveState.rollRight + this.moveState.rollLeft );

  // console.log( 'rotate:', [ this.rotationVector.x, this.rotationVector.y, this.rotationVector.z ] );

};

DotaControls.prototype.getContainerDimensions = function() {

  if ( this.domElement !== document ) {

    return {
      size  : [ this.domElement.offsetWidth, this.domElement.offsetHeight ],
      offset  : [ this.domElement.offsetLeft,  this.domElement.offsetTop ]
    };

  } else {

    return {
      size  : [ window.innerWidth, window.innerHeight ],
      offset  : [ 0, 0 ]
    };

  }

};



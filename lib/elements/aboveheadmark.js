'use strict';

var inherits = require('inherits');

module.exports = AboveMark;

/**
 * @exports threearena/elements/abovemark
 * 
 * @constructor
 */
function AboveMark (options) {

  var self = this;
  
  THREE.Object3D.apply(this);
  self.position.y = 20;
  self.scale.set( 0.6, 0.6, 0.6 );

  options = options || {};

  var material = new THREE.MeshBasicMaterial({ color:'#FFD100' });

  var loader = new THREE.JSONLoader();
  loader.load('/gamedata/models/markers/abovehead_sims.js', function ( geometry ) {
    
    var object = new THREE.Mesh( geometry, material );
    self.add(object);

    if (options.onLoad) { options.onLoad(); }
  });
}

inherits(AboveMark, THREE.Object3D);

AboveMark.prototype.update = function() {

};

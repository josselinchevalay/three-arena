'use strict';

var _ = require('lodash');
var inherits = require('inherits');

var Character = require('../character');

module.exports = Human;

/**
 * @exports threearena/character/human
 * 
 * @constructor
 */
function Human ( options ) {

  var self = this;

  options = _.merge({

    life: 100,
    mana: false,

    name: 'Human',
    image: '/gamedata/models/human/portrait.gif',

    onLoad: null,

  }, options);

  Character.apply( this, [ options ]);

  var loader = new THREE.JSONLoader();

  loader.load( '/gamedata/models/human/human.js', function (geometry, materials) {
    // for preparing animation
    for (var i = 0; i < materials.length; i++) {
      materials[i].morphTargets = true;
    }
        
    var material = new THREE.MeshFaceMaterial( materials );
    self.character = new THREE.Mesh( geometry, material );
    self.character.scale.set(10,10,10);

    self.add( self.character );
  });
}

inherits(Human, Character);

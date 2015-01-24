'use strict';

var _ = require('lodash');
var inherits = require('inherits');

var Character = require('../character');

module.exports = Ogro;

/**
 * @exports threearena/character/ogro
 *
 * @constructor
 *
 * @param {Object} options options
 * @param {object=} options.name Character name
 * @param {object=} options.image Path to character portrait
 * @param {object=} options.life Character Base life
 * @param {object=} options.mana Character Base mana
 *
 * @extends {module:threearena/entity}
 */
function Ogro ( options ) {

  var self = this;

  options = _.merge({

    life: 100,
    mana: false,

    radius: 3.0,

    name: 'Ogro',
    image: '/gamedata/models/ogro/portrait.gif',

    modelOptions: {
      baseUrl: '/gamedata/models/ogro/',
      body: 'ogro-light.js',
      skins: [
        'grok.jpg',
        'ogrobase.png',
        'arboshak.png',
        'ctf_r.png',
        'ctf_b.png',
        'darkam.png',
        'freedom.png',
        'gib.png',
        'gordogh.png',
        'igdosh.png',
        'khorne.png',
        'nabogro.png',
        'sharokh.png'
      ],
      weapons:  [ [ 'weapon-light.js', 'weapon.jpg' ] ],
      animations: {
        move: 'run',
        idle: 'stand',
        jump: 'jump',
        attack: 'attack',
        crouchMove: 'cwalk',
        crouchIdle: 'cstand',
        crouchAttach: 'crattack'
      },
      walkSpeed: 300,
      crouchSpeed: 175
    },

    onLoad: null,

  }, options);

  Character.apply( this, [ options ]);

  this.character = new THREE.MD2CharacterComplex();
  this.character.scale = 0.25;
  this.character.controls = {
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false
  };

  var baseCharacter = new THREE.MD2CharacterComplex();
  baseCharacter.scale = 1;

  baseCharacter.onLoadComplete = function () {
    self.character.shareParts( baseCharacter );
    self.character.enableShadows( true );

    // disable speed
    self.character.maxSpeed =
    self.character.maxReverseSpeed =
    self.character.frontAcceleration =
    self.character.backAcceleration =
    self.character.frontDecceleration =
    self.character.angularSpeed = 0;
    self.character.setWeapon( 0 );
    self.character.setSkin( 0 );

    self.character.root.position.set(0, 0, 0);

    self.character.meshBody.position.y = 2;
    self.character.meshWeapon.position.y = 2;

    self.character.meshBody.rotation.y = 180 * Math.PI / 2;
    self.character.meshWeapon.rotation.y = 180 * Math.PI / 2;

    self.add(self.character.root);

    if (options.onLoad) { options.onLoad.apply(self); }
  };

  baseCharacter.loadParts( options.modelOptions );
}

inherits(Ogro, Character);


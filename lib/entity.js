'use strict';

var _ = require('lodash');
var inherits = require('inherits');
//var EventEmitter = require('events').EventEmitter;

var log = require('./log');
var Utils = require('./utils');
var Spell = require('./spell');
var LifeBar = require('./elements/slifebar');
var AttackCircle = require('./controls/attackcircle');
var PathFinding = require('./pathfinding/recast').Module;

module.exports = Entity;


/**
 * A living entity
 *
 * @summary azd azdzad azd zadazd azdzadzadazdazdzd
 * 
 * @exports threearena/entity
 * 
 * @triggers 'changed' when state (attributes, spells, etc) change
 * @triggers 'hit' when being hit
 * @triggers 'death' when being killed
 *
 * @constructor
 * @param {Object} options
 *          name, image, life, mana, strength, agility, intelligence,
 *          spells, level, meleeDef, meleeDamage, spellDefense, spellDamage
 */
function Entity (options) {

  var self = this;

  THREE.Object3D.apply(this);

  this.state = _.merge({

    name: Math.random(),
    image: '/gamedata/unknown.png',

    tomb: '/gamedata/models/rts_elements.dae',

    life: 100,
    mana: 0,

    speed: 50,

    strength: 1,
    agility: 1,
    intelligence: 1,

    spells: [],

    level: 1,

    meleeDefense: 1,
    meleeDamage: 1,

    spellDefense: 1,
    spellDamage: 1,

    attackRange: 0

  }, options);

  this._baseLife = this.state.life;
  this._baseMana = this.state.mana;

  // this.attachLifeBar(); // now done in game.add()
  this.attachTombstone();

  this.emit('death', function(){
    if (this.currentTween) {
      this.currentTween.stop();
    }
    if (this.behaviour) {
      this.behaviour.identifier = 'beDead';
    }
  });

  this._meleeCircle = new AttackCircle(5);
  this.add(this._meleeCircle);
  this._spellCircle = new AttackCircle(20);
  this.add(this._spellCircle);

  this.states = {

    idle: function() { },

    canBeDead: function() { return self.isDead(); },
    beDead: function() { },

    canFightObjective: function () {
      return ! self.isDead() && self.objective && (! self.objective.isDead || ! self.objective.isDead()) && self.state.spells[0].canHit(self, self.objective, 3);
    },
    fightObjective: function () {
      if (self._currentTween) {
        self._isMoving = false;
        self._currentTween.stop();
        self._currentTween.onComplete();
      }
      self._isFighting = true;

      self.cast(self.state.spells[0], self.objective);
    },

    canFightNearbyEnnemy: function () {

      if (self.isDead()) {
        return false;
      }

      var spell;
      if (self.state.autoAttackSpell !== null && self.state.autoAttacks && self.state.spells[ self.state.autoAttackSpell ]) {

        var i = -1,
          charDistance,
          minDistance = Number.MAX_VALUE;

        spell = self.state.spells[ self.state.autoAttackSpell ];

        self._nearestEnnemy = false;
        while (i++ < self.game.pcs.length - 1) {
          if (self.game.pcs[i].isDead()) { continue; }

          charDistance = self.game.pcs[i].position.distanceTo(self.position);

          if (charDistance < minDistance && self.state.team !== self.game.pcs[i].state.team && spell.canHit(self, self.game.pcs[i], 3)) {
            minDistance = charDistance;
            self._nearestEnnemy = self.game.pcs[i];
          }
        }
      }

      if (! self._nearestEnnemy) {

        if (self._isFighting) {
          // was fighting, must replan
          self._currentRoute = null;
          self._isMoving = false;
        }

        // nnope, no one's there
        self._isFighting = false;
        self._fightingArc = false;

        return false;

      } else {

        return true;
      }
    },
    fightNearbyEnnemy: function () {
      if (self._currentTween) {
        self._isMoving = false;
        self._currentTween.stop();
        self._currentTween.onComplete();
      }
      self._isFighting = true;
      self.cast(self.state.spells[0], self._nearestEnnemy);
    },

    plotCourseToObjective: function () {
      if (! self._currentRoute) {
        PathFinding.findPath(
          self.position.x, self.position.y, self.position.z,
          self.objective.position.x, self.objective.position.y, self.objective.position.z,
          100000,
          Utils.gcb( _.bind( self._setRoute, self) )
        );
      }
    },
    canPlotCourseToObjective: function () {
      return ! self.isDead() && self.objective && ! this._isFighting && ! self._currentRoute;
    },

    followCourseToObjective: function () {
      if (self._isMoving || ! self._currentRoute) { return; }
      if (self._currentTween) {
        self._currentTween.stop();
        self._currentTween.onComplete();
      }
      this._isFighting = false;
      self._currentTween = self.moveAlong(self._currentRoute, {
        onStart: function(){
          self._isMoving = true;
        },
        onComplete: function(tween){
          self._isMoving = false;
          if (tween.distance >= 1) {
            self._currentRoute = null;
          }
        }
      });
    },

    canFollowCourseToObjective: function () {
      return ! self.isDead() &&
        self.objective &&
        self._currentRoute &&
        ! this._isFighting &&
        ! self.states.canFightObjective() &&
        ! self.states.canFightNearbyEnnemy();
    },

    moveAttackToObjective: function () {
      self.states.followCourseToObjective();
    },

    canMoveAttackToObjective: function () {
      return ! self.isDead() && (self.objective && self.objective.position.distanceTo(self.position) > 2);
    },

  };

  this.emit('changed', this.state);
}

inherits(Entity, THREE.Object3D);

//////////////////

Entity.prototype.on = Entity.prototype.addEventListener;

Entity.prototype.emit = function (event, data) {
  data.type = event;
  this.dispatchEvent(data);
};

//////////////////

Entity.prototype._setRoute = function (linepoints) {

  if (linepoints && linepoints.length > 0) {
    log(log.SYS_DEBUG, '%o finds a way from %o to %o', this, linepoints[0], linepoints[linepoints.length - 1]);

    this._currentRoute = linepoints; // new THREE.SplineCurve3(linepoints);

  } else {
    this._currentRoute = null;
  }
};

Entity.prototype._addRoute = function (linepoints) {

  if (linepoints && linepoints.length > 0) {
    log(log.SYS_DEBUG, '%o finds a way from %o to %o', this, linepoints[0], linepoints[linepoints.length - 1]);

    if (! this._currentRoute) {
      this._nextRoutes = [];
    }

    this._nextRoutes.push(linepoints);
  }
};

//////////////////

/**
 * Attach a life/mana bar above the entity
 */
Entity.prototype.attachLifeBar = function() {

  this.lifebar = new LifeBar();
};

/**
 * Update the character lifebar
 */
Entity.prototype.updateLifeBar = function() {

  var eventData = {
    life: this._baseLife === false ? false : this._baseLife > 0 ? 1 / this._baseLife * this.state.life : 0,
    mana: this._baseMana === false ? false : this._baseMana > 0 ? 1 / this._baseMana * this.state.mana : 0
  };

  // this.lifebar.position.copy(this.position.x).setY(20);
  this.lifebar.set(eventData);

  this.emit('changed', eventData);
};

/**
 * Attach a tomb, to replace the dead entity
 */
Entity.prototype.attachTombstone = function() {

  var self = this;
  var loader = new THREE.ColladaLoader();
  loader.load( self.state.tomb, function ( loaded ) {

    self.tomb = loaded.scene.getObjectByName('Cross2');

    self.tomb.castShadow = true;
    self.tomb.rotation.x = -90 * Math.PI / 180;
    self.tomb.scale.set(2, 2, 2);
    self.tomb.position.set(0, 0, 0);

    // when character die, show just a tomb
    self.on('death', function() {
      self.update = function(){};

      var children = _.clone(self.children);
      _.each(children, function(child){ self.remove(child); });

      children = _.clone(self.character.children);
      _.each(children, function(child){ self.character.remove(child); });

      self.add(self.tomb);
    });
  });
};


/**
 * Add a life amount
 * @param  {Number} increment
 * @return {Number} new life amount
 */
Entity.prototype.incrementLife = function(inc) {

  this.state.life = Math.max( 0, this.state.life + inc );
  return this.state.life;
};

/**
 * Add a mana amount
 * @param  {Number} inc
 * @return {Number} new mana amount
 */
Entity.prototype.incrementMana = function(inc) {

  this.state.mana = Math.max( 0, this.state.mana + inc );
  return this.state.mana;
};

/**
 * Returns true if entity is dead
 * @return {Boolean}
 */
Entity.prototype.isDead = function() {

  return this.state.life <= 0;
};

/**
 * Returns true if entity is alive
 * @return {Boolean}
 */
Entity.prototype.isAlive = function() {

  return ! this.isDead();
};

/**
 * Returns true if entity is out of mana
 * @return {Boolean}
 */
Entity.prototype.isOutOfMana = function() {

  return this.state.mana <= 0;
};

/**
 * Make the entity move along a path
 * @param  {Array|THREE.Shape} the shape, or the points the entity will walk along
 * @param  {Object} options, such as
 *              start
 *              onStart
 *              onComplete
 *              onUpdate
 * @return {Tween} the Tween.js object
 */
Entity.prototype.moveAlong = function() {

  throw 'Parent class Entity cannot move';
};

/**
 * Learn a spell
 * @param  {Spell} spell class
 * @trigger 'changed'
 */
Entity.prototype.learnSpell = function(SpellClass) {

  this.state.spells.push(new SpellClass({ source: this }));

  this.emit('changed', this);
};

/**
 * Cast a spell
 * @param  {Spell} spell
 * @return {Boolean} True if spell has been casted
 */
Entity.prototype.cast = function(spell, target) {

  log(log.COMBAT, '%o begins to cast %o', this, spell);

  // handle cooldown
  if (spell.ccd > 0) {

    // console.log('this spell is not ready yet (%dms)', spell.ccd);
    return;

  } else {
    spell.startCooldown(this);
  }

  // place myself on a correct attacking range arc
  if (spell.isMelee && ! this._fightingArc) {

    var radius  = spell.maxRange + target.state.attackRange,
        start   = (new THREE.Vector3( -radius, 0, 0 )).add(target.position),
        middle  = (new THREE.Vector3( 0, 0, -radius )).add(target.position),
        end     = (new THREE.Vector3(  radius, 0, 0 )).add(target.position);

    this._fightingArc = new THREE.QuadraticBezierCurve3(start, middle, end);
    var p = this._fightingArc.getPointAt(Math.random());

    this.position.set( p.x, p.y, p.z );
  }

  spell.start(this, target);

  return true;
};

/**
 * Hit this entity with a spell
 * 
 * @param  {Spell} spell
 * @triggers 'hit', 'changed', 'death'
 */
Entity.prototype.hit = function(spell) {

  spell.target = this;

  var eventData = {
    dodged: 0,
    meleeLifeDamageReceived: 0,
    magicLifeDamageReceived: 0,
    manaDamageReceived: 0,
    spell: spell
  };

  eventData.meleeLifeDamageReceived = spell.meleeLifeDamage;
  eventData.magicLifeDamageReceived = spell.magicLifeDamage;
  eventData.manaDamageReceived = spell.manaDamage;

  eventData.totalLifeDamage = eventData.meleeLifeDamageReceived + eventData.magicLifeDamageReceived;

  // apply hits
  this.incrementLife(-eventData.totalLifeDamage);
  this.incrementMana(-eventData.manaDamageReceived);

  this.updateLifeBar();

  this.emit('hit', eventData);

  log(log.COMBAT, '%o hit %o with %o : %d + %d + %d (%s) - %s' ,
    spell.source, this,
    spell.name, eventData.magicLifeDamageReceived, eventData.meleeLifeDamageReceived, eventData.manaDamageReceived,
    (spell.isCritical ? 'critical' : 'normal'), eventData.damageAbsorbed
  );

  // send events & animations
  if (this.isDead()) {

    this.emit('death', eventData);
    if (this.character) { this.character.setAnimation('death'); }

  } else {

    if (this.character) { this.character.setAnimation('pain'); }
  }
};
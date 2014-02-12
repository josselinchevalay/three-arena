'use strict';

var _ = require('lodash');
var ko = require('knockout');

module.exports = GameViewModel;

/**
 * @exports threearena/views/gameview
 */
function GameViewModel (game) {

  var self = this;

  this.game = game;

  ////////////////////////////////     
  
  this._currentMap = null;

  ////////////////////////////////     

  self.mapWidth = ko.observable(0);
  self.mapHeight = ko.observable(0);

  self.characters = [
    ko.observable({ x:-1000, z:-1000 }),
  ];

  this.image = ko.observable(null);

  ////////////////////////////////     

  // find the main ground mesh, 
  this.game.on('set:terrain', function() {

    // pass its texture image
    if (game.ground.options.minimap && game.ground.options.minimap.defaultmap) {
      self.image(game.ground.options.minimap.defaultmap);

    } else if (game.ground.options.minimap) {
      self.image(game.ground.options.minimap);

    } else if (game.ground.options.tDiffuse) {
      self.image(game.ground.options.tDiffuse);

    } else if (game.ground.options.map.image.src) {
      self.image(game.ground.options.map.image.src);

    } else {
      // no image :/
      // self.image();
    }

    game.ground.traverse(function (child) {
      if (child instanceof THREE.Mesh) {
        var geometry = child.geometry;
        if (!geometry.boundingBox) {
          geometry.computeBoundingBox();
        }

        self.mapWidth(geometry.boundingBox.max.x - geometry.boundingBox.min.x);
        self.mapHeight(geometry.boundingBox.max.z - geometry.boundingBox.min.z);
      }
    });
  });

  this.update = function(game) {

    _.each(game.entities, function(c,i){
      if (self.characters[i] === undefined) {
        self.characters[i] = ko.observable();
      }

      // position playing characters
      self.characters[i]({
        x: 100 / self.mapWidth() * (game.entities[i].position.x + self.mapWidth() / 2),
        z: 100 / self.mapHeight() * (game.entities[i].position.z + self.mapHeight() / 2)
      });

      // update level map
      if (_.isObject(game.ground.options.minimap)) {
        var found = false;
        _.each(game.ground.options.minimap, function(image, key){
          if (found) { return; }
          var x = game.entities[0].position.x,
              y = game.entities[0].position.y,
              z = game.entities[0].position.z;
          try {
            found = eval(key);
          } catch (e) {

          }
          if (found) {
            self.image(image);
          }
        });
      }
    });
  };

  this.game.on('update', this.update.bind(this));
}

GameViewModel.prototype.onMapClick = function(gameview, event) {
  // ignore if there's no button clicked, useful for ugly mousedrag event
  if (! event.which) { return; }

  var target = $(event.currentTarget);
  var halfX = gameview.mapWidth() / 2,
      halfZ = gameview.mapHeight() / 2,
      mapX = (gameview.mapWidth() / target.width() * event.offsetX) - halfX,
      mapZ = (gameview.mapHeight() / target.height() * event.offsetY) - halfZ + 40;

  this.game.camera.position.set(mapX, 50, mapZ);
};

GameViewModel.prototype.onCharacterHover = function(event) {
};

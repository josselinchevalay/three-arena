define('threearena/character',
    ['lodash', 'threejs', 'threearena/log', 'threearena/utils', 'threearena/entity'], function(_, THREE, log, Utils, Entity) {

    var Character = function(options) {

    /*

    Strength is a measure of a Hero's toughness and endurance. Strength determines a Hero's maximum health and health regeneration. Heroes with strength as their primary attribute can be hard to kill, so they will often take initiator and tank roles, initiating fights and taking most of the damage from enemy attacks.
    Every point in strength increases maximum health by 19.
    Every point in strength increases health regeneration by 0.03 HP per second.
    If strength is a Hero's primary attribute, every point in strength increases his or her attack damage by 1.

    Agility is a measure of a Hero's swiftness and dexterity. Agility determines a Hero's armor and attack speed. Heroes with agility as their primary attribute tend to be more dependent on their auto-attacks and items, and are usually capable of falling back on their abilities in a pinch. Agility Heroes often take carry and Gank roles.
    Every 7 points in agility increases a Hero's armor by 1.
    Every point in agility increases a Hero's attack speed by 1.
    If agility is a Hero's primary attribute, every point in agility increases his or her attack damage by 1.

    Intelligence
    Intelligence is a measure of a Hero's wit and wisdom. Intelligence determines a Hero's maximum mana and mana regeneration. Heroes with intelligence as their primary attribute tend to rely on their abilities to deal damage or help others. Intelligence Heroes often take support, gank, and pusher roles.
    Every point in intelligence increases a Hero's maximum Mana by 13.
    Every point in intelligence increases a Hero's mana regeneration by 0.04 mana per second.
    If intelligence is a Hero's primary attribute, every point in intelligence increases his or her attack damage by 1.

    */


        Entity.apply(this, [ options ]);
    };

    Character.prototype = new Entity();

    ////////////////

    Character.prototype.update = function(delta) {

        this.character.update(delta)
    };

    Character.prototype.moveAlong = function(linepoints) {

        var self = this;
        
        // stop current move
        if (self.currentTween) {
            self.currentTween.stop();
            delete self.currentTween;
        }

        this.currentTween = Utils.moveAlong(self, linepoints, {
            onStart: function(){
                self.character.controls.moveForward = true;
            },
            onComplete: function(){
                self.character.controls.moveForward = false;
            },
            onUpdate: function(tween, shape) {
                // get the orientation angle quarter way along the path
                var tangent = shape.getTangent(tween.distance);
                var angle = Math.atan2(-tangent.z, tangent.x);

                // set angle of the man at that position
                // object.rotation.y = angle;
                self.character.meshes.forEach(function(m){
                    m.rotation.y = angle;
                });
            }
        });
        return this.currentTween;
    };

    ////////////////

    Character.prototype.constructor = Character;

    return Character;
});

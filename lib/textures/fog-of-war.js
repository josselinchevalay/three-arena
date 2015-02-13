
'use strict';

module.exports = FogOfWarMap;

function FogOfWarMap (width, height) {

    // create canvas
    this.canvas = document.createElement( 'canvas' );

    this.canvas.width  = width;
    this.canvas.height = height;

    // get context
    this.context = this.canvas.getContext('2d');

    this.background();
}

FogOfWarMap.prototype.background = function() {

    this.context.fillStyle = 'rgba( 255, 255, 255, 0.1 )';
    this.context.fillRect( 0, 0, this.canvas.width, this.canvas.height );
};

FogOfWarMap.prototype.render = function(locations) {

    for (var i = locations.length - 1; i >= 0; i--) {

        var loc = locations[i];
        var radius = 20;

        this.context.beginPath();
        this.context.arc(loc.x, loc.z, radius, 0, 2 * Math.PI, true);
        this.context.fillStyle = 'rgba( 255, 255, 255, 1 )';
        this.context.fill();

        // Create gradient
        // var grd = this.context.createRadialGradient(loc.x, loc.y, 0.000, loc.x, loc.y, radius);

        // // Add colors
        // grd.addColorStop(0.000, 'rgba(255, 255, 255, 1.000)');
        // grd.addColorStop(1.000, 'rgba(0, 0, 0, 1.000)');

        // // Fill with gradient
        // this.context.fillStyle = grd;
        // this.context.fillRect(0, 0, 300.000, 300.000);
    }
};
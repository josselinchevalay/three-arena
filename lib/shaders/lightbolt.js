'use strict';

var inherits = require('inherits');

var ashima3Dnoise = require('./ashima/classicnoise3D.glsl');

module.exports = LightboltShaderMaterial;

/**
 * @exports threearena/shaders/lightbolt
 */
function LightboltShaderMaterial (strands) {

  THREE.ShaderMaterial.apply(this, [{
    shading: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    transparent: true,

    uniforms: {
      time: { type: 'f', value: 1.0 },
      resolution: { type: 'v2', value: new THREE.Vector2() }
    },
    vertexShader: [
        // ashima3Dnoise,
        // 'float turbulence( vec3 p ) {',
        // '    float w = 100.0;',
        // '    float t = -.5;',
        // '    for (float f = 1.0 ; f <= 10.0 ; f++ ){',
        // '        float power = pow( 2.0, f );',
        // '        t += abs( pnoise( vec3( power * p ), vec3( 10.0, 10.0, 10.0 ) ) / power );',
        // '    }',
        // '    return t;',
        // '}',

        'varying vec2 vUv;',
        'void main() {',
        '   vUv = uv;',

        // // get a turbulent 3d noise using the normal, normal to high freq
        // '   noise = 10.0 *  -.10 * turbulence( .5 * normal );',
        // // get a 3d noise using the position, low frequency
        // '   float b = 5.0 * pnoise( 0.05 * position, vec3( 100.0 ) );',
        // // compose both noises
        // '   float displacement = - 10. * noise + b;',
        // // move the position along the normal and transform it
        // '   vec3 newPosition = position + normal * displacement;',

        '   vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',
        '   gl_Position = projectionMatrix * mvPosition;',
        '}'
    ].join(''),

    fragmentShader: [
        'uniform vec2 resolution;',
        'uniform float time;',

        'varying vec2 vUv;',

         // Lightning shader
         // rand,noise,fmb functions from https://www.shadertoy.com/view/Xsl3zN

        'float rand(vec2 n) {',
        '    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);',
        '}',

        'float noise(vec2 n) {',
        '    const vec2 d = vec2(0.0, 1.0);',
        '    vec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));',
        '    return mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);',
        '}',

        'float fbm(vec2 n) {',
        '    float total = 0.0, amplitude = 1.0;',
        '    for (int i = 0; i < 7; i++) {',
        '        total += noise(n) * amplitude;',
        '        n += n;',
        '        amplitude *= 0.5;',
        '    }',
        '    return total;',
        '}',

        'void main(void) {',
        '    vec2 position = vUv;',
        '    vec4 col = vec4(0,0,0,0);',

             // vec2 uv = gl_FragCoord.xy * 1.0 / resolution.xy; // screen space
        '    vec2 uv = 1.0 * position;', // object face space

             // draw a line, left side is fixed
        '    vec2 t = uv * vec2(2.0,1.0) - time*3.0;',
        '    vec2 t2 = (vec2(1,-1) + uv) * vec2(3.0,1.0) - time*3.0;', // a second strand

             // draw the lines,
             // this make the left side fixed, can be useful
             // float ycenter = mix( 0.5, 0.25 + 0.25*fbm( t ), uv.x*4.0);
             // float ycenter2 = mix( 0.5, 0.25 + 0.25*fbm( t2 ), uv.x*4.0);
        '    float ycenter = fbm(t)*0.5;',
        '    float ycenter2= fbm(t2)*0.5;',

             // falloff
        '    float diff = abs(uv.y - ycenter);',
        '    float c1 = 1.0 - mix(0.0,1.0,diff*40.0);',

        '    float diff2 = abs(uv.y - ycenter2);',
        '    float c2 = 1.0 - mix(0.0,1.0,diff2*20.0);',

        '    float c = max(c1,c2);',
        '    col = vec4(c*0.4,0.2*c2,c,c);',
        '    gl_FragColor = col;',
        '}'
    ].join(''),
    }]);
}

inherits(LightboltShaderMaterial, THREE.ShaderMaterial);

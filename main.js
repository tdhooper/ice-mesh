Math.seedrandom('6');

var width = window.innerWidth;
var height = window.innerHeight;

var camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
camera.position.z = 5;

var controls = new THREE.TrackballControls(camera);

renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
});
renderer.setSize(width, height);
document.body.appendChild(renderer.domElement);

var scene = new THREE.Scene()

var boxes = new THREE.Group();
scene.add(boxes);


var icoGeom = new THREE.IcosahedronGeometry(13, 2);


var randomPointOnSphere = function(radius) {
    var u = Math.random();
    var v = Math.random();
    var phi = 2 * Math.PI * u;
    var theta = Math.acos(2 * v - 1);
    var x = radius * Math.sin(theta) * Math.cos(phi);
    var y = radius * Math.sin(theta) * Math.sin(phi);
    var z = radius * Math.cos(theta);
    return new THREE.Vector3(x, y, z);
};

var gain = function(x, P) {
    if (x > 0.5) {
        return 1.0 - 0.5 * Math.pow(2.0 - 2.0 * x, P);
    } else {
        return 0.5 * Math.pow(2.0 * x, P);
    }
};

var col0 = new THREE.Color(0xdfecff);
var col1 = new THREE.Color(0xffffff);
var col2 = new THREE.Color(0x79a2d0);
var col3 = new THREE.Color(0x122546);

scene.background = col0;


var addBox = function(size, position, color) {
    var geometry = new THREE.BoxGeometry(size, size, size);
    var material = new THREE.MeshBasicMaterial({
        color: color
    });
    var box = new THREE.Mesh( geometry, material );
    box.position.copy(position);
    boxes.add(box);
}

icoGeom.vertices.forEach(function(vert) {
    var direction, position, size;

    direction = randomPointOnSphere(.5);
    position = vert.clone().add(direction);
    size = Math.random() * 1 + 1;
    addBox(size, position, col2);

    direction = randomPointOnSphere(5);
    position = vert.clone();
    position.multiplyScalar(.8);
    position.add(direction);
    size = Math.random() * .75 + .75;
    addBox(size, position, col1);
});


var cubeCamera = new THREE.CubeCamera( 1, 100000, 128 );
scene.add( cubeCamera );
cubeCamera.update(renderer, scene);

scene.background = col1;
boxes.visible = false;

var startTime = Date.now();
var uniforms = {
    time: { type: "f", value: 1.0 },
};

function IceMaterial(parameters) {
    THREE.ShaderMaterial.call(this);

    this.envMap = null;

    // this.isMeshStandardMaterial = true;
    this.setValues( parameters );

    this.uniforms = THREE.UniformsUtils.merge( [
        THREE.UniformsLib.common,
        THREE.UniformsLib.specularmap,
        THREE.UniformsLib.envmap,
        THREE.UniformsLib.aomap,
        THREE.UniformsLib.lightmap,
        THREE.UniformsLib.emissivemap,
        THREE.UniformsLib.fog,
        THREE.UniformsLib.lights,
        this.uniforms
    ] );

    this.uniforms.envMap.value = this.envMap;
}

IceMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
IceMaterial.prototype.constructor = IceMaterial;

var material = new IceMaterial({
    envMap: cubeCamera.renderTarget.texture,
    uniforms: uniforms,
    vertexShader: document.getElementById( 'vertexShader' ).textContent,
    fragmentShader: document.getElementById( 'fragmentShader' ).textContent
});

material.envMap.mapping = THREE.CubeRefractionMapping;


var shape = function(u, v) {
    var phi = u * Math.PI * 2;
    var theta = v * Math.PI;
    var radius = -1;
    var x = radius * Math.sin(theta) * Math.cos(phi);
    var y = radius * Math.sin(theta) * Math.sin(phi);
    var z = radius * Math.cos(theta);
    var point = new THREE.Vector3(x, y, z);

    var PHI = ( 1 + Math.sqrt( 5 ) ) / 2;
    var vertices = [
        [0, PHI, 1],
        [0, -PHI, 1],
        [1, 0, PHI],
        [-1, 0, PHI],
        [PHI, 1, 0],
        [-PHI, 1, 0]
    ];

    var scale = 0;

    vertices.forEach(function(v) {
        var vertex = new THREE.Vector3().fromArray(v).normalize();

        var d = (point.dot(vertex))* .5 + .5;
        var d1 = Math.sin(d * Math.PI * 5.) * .5 + .5;
        var d2 = Math.sin(d * Math.PI * 9.) * .5 + .5;
        d = d1 - d2 * 1.5;
        d = 1. - d; 
        scale += d;
    });

    scale /= vertices.length;
    scale = THREE.Math.lerp(0, .7, scale);

    // point.multiplyScalar(scale);
    return point;
}

var geometry = new THREE.ParametricGeometry(shape, 200, 200 );
var mesh = new THREE.Mesh( geometry, material );
scene.add( mesh );



function render() {
    var elapsedMilliseconds = Date.now() - startTime;
    var elapsedSeconds = elapsedMilliseconds / 1000.;
    material.uniforms.time.value = 60. * elapsedSeconds;
    
    mesh.rotation.x = elapsedSeconds * 1;
    mesh.rotation.y = elapsedSeconds * .5;
    mesh.rotation.z = elapsedSeconds * .25;

    renderer.render(scene, camera);
}

function animate() {
    render();
    controls.update();
    requestAnimationFrame(animate);
}

function onWindowResize() {
    var DPR = (window.devicePixelRatio) ? window.devicePixelRatio : 1;
    DPR *= 2;
    var width = window.innerWidth;
    var height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width * DPR, height * DPR);
}


window.addEventListener('resize', onWindowResize, false);
onWindowResize();
animate();

var container;
var camera, scene, renderer, controls;
var plane, cube;
var mouse, raycaster;
var rollOverMesh, rollOverMaterial, rollOverGeo;
var cubeGeo, cubeMaterial;
var objects = [];
var coords = [];
var topView = true,
    mouseDown = false,
    creating = false,
    deleting = false;

init();
animate();

function init() {
  container = document.createElement( 'div' );
  document.body.appendChild( container );

  var info = document.createElement( 'div' );
  info.style.position = 'absolute';
  info.style.top = '10px';
  info.style.width = '100%';
  info.style.textAlign = 'center';
//  info.innerHTML = '<button id="view">View</button><br/><br/><button id="save">Save</button>';
  info.innerHTML = '<button id="view">View</button>';
  container.appendChild( info );

  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
  camera.position.set( 0, 2000, 0 );
  camera.lookAt( new THREE.Vector3() );

  controls = new THREE.OrbitControls( camera );
  controls.enablePan = false
  controls.enableDamping = true;
  controls.dampingFactor = 0.25;
  controls.rotateSpeed = 0.3
  controls.enabled = false

  scene = new THREE.Scene();

  // roll-over helpers
  rollOverGeo = new THREE.BoxGeometry( 50, 50, 50 );
  rollOverMaterial = new THREE.MeshBasicMaterial( { color: 0x8993a3, opacity: 0.5, transparent: true } );
  rollOverMesh = new THREE.Mesh( rollOverGeo, rollOverMaterial );
  scene.add( rollOverMesh );

  // cubes
  cubeGeo = new THREE.BoxGeometry( 50, 50, 50 );
  cubeMaterial = new THREE.MeshLambertMaterial( { color: 0x8993a3 } );

  // grid
  var size = 500, step = 50;
  var geometry = new THREE.Geometry();
  for ( var i = - size; i <= size; i += step ) {
    geometry.vertices.push( new THREE.Vector3( - size, 0, i ) );
    geometry.vertices.push( new THREE.Vector3(   size, 0, i ) );
    geometry.vertices.push( new THREE.Vector3( i, 0, - size ) );
    geometry.vertices.push( new THREE.Vector3( i, 0,   size ) );
  }
  var material = new THREE.LineBasicMaterial( { color: 0x000000, opacity: 0.2, transparent: true } );
  var line = new THREE.LineSegments( geometry, material );
  scene.add( line );
  //

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  var geometry = new THREE.PlaneBufferGeometry( 1000, 1000 );
  geometry.rotateX( - Math.PI / 2 );
  plane = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { visible: false } ) );
  scene.add( plane );
  objects.push( plane );

  // Lights
  var ambientLight = new THREE.AmbientLight( 0x606060 );
  scene.add( ambientLight );

  var directionalLight = new THREE.DirectionalLight( 0xffffff );
  directionalLight.position.set( 1, 0.75, 0.5 ).normalize();
  scene.add( directionalLight );

  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setClearColor( 0xf0f0f0 );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );

  container.appendChild( renderer.domElement );
  document.addEventListener( 'mousemove', onDocumentMouseMove, false );
  document.addEventListener( 'mousedown', onDocumentMouseDown, false );
  document.addEventListener( 'mouseup', onDocumentMouseUp, false );
  //
  window.addEventListener( 'resize', onWindowResize, false );
}

document.getElementById('view').onclick = function() {
  if (topView) {
    camera.position.set(800, 500, 800);
    rollOverMesh.visible = false
  }
  else {
    camera.position.set(0, 2000, 0)
    rollOverMesh.visible = true
  }
  camera.lookAt( new THREE.Vector3() );
  topView = !topView
  controls.enabled = !controls.enabled
}

/*
document.getElementById('save').onclick = function() {
  localStorage.setItem('coords', JSON.stringify(coords))
  console.log('Save coordinates to localStorage');
}
*/

function addCoords(x, y) {
  var xOffset = (x > 0) ? 25 : -25;
  var yOffset = (y > 0) ? 25 : -25;
  var mapX = (x + xOffset) / 50 + 10
  var mapY = (y + yOffset) / 50 + 10
  coords.push({x: mapX, y: mapY})
}

function removeCoords(x, y) {
  var xOffset = (x > 0) ? 25 : -25;
  var yOffset = (y > 0) ? 25 : -25;
  var mapX = (x + xOffset) / 50 + 10
  var mapY = (y + yOffset) / 50 + 10
  coords.forEach((element, index) => {
    if (element.x === mapX && element.y === mapY) {
      coords.splice(index, 1)
    }
  })
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}

function onDocumentMouseMove( event ) {
  if (!topView) { return; }
  event.preventDefault();
  mouse.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );
  raycaster.setFromCamera( mouse, camera );
  var intersects = raycaster.intersectObjects( objects );
  if ( intersects.length > 0 ) {
    var intersect = intersects[ 0 ];
    if (intersect.object === plane) {
      rollOverMesh.position.copy( intersect.point ).add( intersect.face.normal );
      rollOverMesh.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 );
    }
    else {
      rollOverMesh.position.copy( intersect.object.position );
    }
    if (deleting) { rollOverMesh.material.color.setHex( 0xff4800 ) }
    else { rollOverMesh.material.color.setHex( 0x8993a3 ) }
  }
  if (mouseDown) {
    onDocumentMouseDown(event)
  }
}

function onDocumentMouseUp( event ) {
  mouseDown = false;
  creating = false
  deleting = false
}

function addCube(object, voxel) {
  if (object === plane) {
    scene.add( voxel );
    objects.push( voxel );
    addCoords(voxel.position.x, voxel.position.z)
  }
}

function deleteCube(object, voxel) {
  if (object !== plane) {
    scene.remove( object );
    objects.splice( objects.indexOf( object ), 1 );
    removeCoords(voxel.position.x, voxel.position.z)
  }
}

function onDocumentMouseDown( event ) {
  mouseDown = true
  if (topView) {
    event.preventDefault();
    mouse.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );
    raycaster.setFromCamera( mouse, camera );
    var intersects = raycaster.intersectObjects( objects );
    if ( intersects.length > 0 ) {
      var intersect = intersects[ 0 ];

      var voxel = new THREE.Mesh( cubeGeo, cubeMaterial );
      voxel.position.copy( intersect.point ).add( intersect.face.normal )
      voxel.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 )

      if (creating) {
        addCube(intersect.object, voxel)
      }
      else if (deleting) {
        deleteCube(intersect.object, voxel)
      }
      else {
        if (intersect.object === plane) {
          creating = true
          addCube(intersect.object, voxel)
        }
        else {
          deleting = true
          deleteCube(intersect.object, voxel)
        }
      }
    }
  }
}

function animate() {
  requestAnimationFrame( animate );
  controls.update()
  TWEEN.update();
  render();
}

function render() {
  if(camera.position.y < 0) {
    var targetPos = {x: camera.position.x, y:50, z:camera.position.z}
    var tween = new TWEEN.Tween(camera.position)
      .to(targetPos, 250)
      .easing(TWEEN.Easing.Quadratic.Out)
      .start()
  }
  renderer.render( scene, camera );
}

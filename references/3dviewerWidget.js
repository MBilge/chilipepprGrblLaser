/**
 * Created by dchu on 8/24/14.
 */
requirejs.config({
    paths: {
        Three: 'http://threejs.org/build/three.min',
        ThreeDetector: 'http://threejs.org/examples/js/Detector',
        ThreeStats: 'http://threejs.org/examples/js/libs/stats.min',
        ThreeTrackballControls: '//threejs.org/examples/js/controls/TrackballControls',
        ThreeOrbitControls: '//threejs.org/examples/js/controls/OrbitControls',
        ThreeHelvetiker: 'http://chilipeppr.com/js/three/threehelvetiker',
        //ThreeHelvetiker: 'https://mrdoob.github.com/three.js/examples/fonts/helvetiker_regular.typeface',
        ThreeTypeface: 'https://superi.googlecode.com/svn-history/r1953/trunk/MBrand/MBrand/Scripts/typeface-0.15',
        //ThreeTween: 'https://raw.githubusercontent.com/sole/tween.js/master/build/tween.min',
        ThreeTween: 'http://www.chilipeppr.com/js/three/tween.min',
        ThreeSparks: 'https://raw.githubusercontent.com/zz85/sparks.js/master/Sparks',
        ThreeParticle: 'https://raw.githubusercontent.com/squarefeet/ShaderParticleEngine/master/build/ShaderParticles.min'
    },
    shim: {
        ThreeTrackballControls: ['Three'],
        ThreeTween: ['Three'],
        ThreeSparks: ['Three'],
        ThreeParticle: ['Three']
    }
});

cprequire_test(['inline:com-chilipeppr-widget-3dviewer'], function (threed) {
    console.log("Running 3dviewer");
    threed.init({doMyOwnDragDrop: true});

    // test resize signal
    setTimeout(function() {
        chilipeppr.publish('/' + threed.id + '/resize', "" );
    }, 3000);

    var testGotoline = function() {
        // send sample gcodeline commands as if the gcode sender widget were sending them
        setTimeout(function() {
            chilipeppr.publish('/com-chilipeppr-widget-3dviewer/gotoline', {line: 3, gcode: "G21 G90 G64 G40"} );
        }, 3000);
        setTimeout(function() {
            chilipeppr.publish('/com-chilipeppr-widget-3dviewer/gotoline', {line: 4, gcode: "G0 Z3.0"}  );
        }, 6000);
        setTimeout(function() {
            chilipeppr.publish('/com-chilipeppr-widget-3dviewer/gotoline', {line: 10, gcode: "G0 X130.8865 Y-11.5919"} );
        }, 9000);
        setTimeout(function() {
            chilipeppr.publish('/com-chilipeppr-widget-3dviewer/gotoline', {line: 11, gcode: "G0 Z1.5"} );
        }, 12000);
        setTimeout(function() {
            chilipeppr.publish('/com-chilipeppr-widget-3dviewer/gotoline', {line: 22, gcode: "G1 F300.0 Z0.0"}  );
        }, 12800);
    }

    var testGotoXyz = function() {
        // send sample gcodeline commands as if the gcode sender widget were sending them
        setTimeout(function() {
            chilipeppr.publish('/com-chilipeppr-interface-cnccontroller/axes', {x:10.0, y:10.0, z:10.0} );
        }, 3000);
        setTimeout(function() {
            chilipeppr.publish('/com-chilipeppr-interface-cnccontroller/axes', {x:-2.0} );
        }, 4000);
        setTimeout(function() {
            chilipeppr.publish('/com-chilipeppr-interface-cnccontroller/axes', {x:3.0, y:2.0} );
        }, 5000);

    }

    //testGotoXyz();

    //threed.init();
    console.log("3d viewer initted");
} /*end_test*/ );

cpdefine('inline:com-chilipeppr-widget-3dviewer', ['chilipeppr_ready', 'Three', 'ThreeDetector', 'ThreeTrackballControls', 'ThreeTween', 'ThreeHelvetiker'], function () {

    return {
        id: 'com-chilipeppr-widget-3dviewer',
        url: "http://fiddle.jshell.net/chilipeppr/y3HRF/show/light/",
        fiddleurl: "http://jsfiddle.net/chilipeppr/y3HRF/",
        name: "Widget / 3D GCode Viewer",
        desc: "Visualize your GCode in 3D by simulating your GCode run or seeing where your run is at in 3D while your CNC operation is in action.",
        publish: {
            '/recv3dObject' : "When you send a /request3dObject you will receive a signal back of /recv3dObject. This signal has a payload of the THREE.js user object being shown in the 3D viewer.",
            '/recvUnits' : 'When you send a /requestUnits you will receive back this signal with a payload of "mm" or "inch" as a string. Please also see /unitsChanged in case you want to know whenever units are changed from a file open event. You can request what units the Gcode are in from the 3D Viewer. Since the 3D Viewer parses Gcode, it can determine the units. The 3D Viewer is mostly unit agnostic, however to draw the toolhead, grid, and extents labels it does need to know the units to draw the decorations in a somewhat appropriate size.',
            '/unitsChanged' : 'This signal is published when the user loads a new file into the 3D viewer and the units change. If other widgets need to know what units are being used, you should subscribe to this signal to be notified on demand.',
            '/sceneReloaded' : "This signal is sent when the scene has been (re)load because the user dragged / dropped. The paypload indicates the global bounding box of the scene"
        },
        subscribe: {
            '/gotoline': "This widget subscribes to this channel so other widgets can move the toolhead and highlight the Gcode line being worked on. This would mostly be when sending Gcode from a Gcode viewer/sender widget, that widget can have the 3D view follow along. Just the line number should be sent as the 3D viewer has it's own cache of the Gcode data loaded.",
            '/resize' : "You can ask this widget to resize itself. It will resize the rendering area to the region it is bound to (typically the window width/height).",
            '/sceneadd' : "You can send Threejs objects to this widget and they will be added to the scene. You must send true THREE.Line() or other ThreeJS objects in that are added as scene.add() objects.",
            '/sceneremove' : "You can also remove objects from the 3D scene. This is the opposite of /sceneadd",
            '/wakeanimate' : "The 3d viewer sleeps the rendering after 5 seconds. So if you are going to do any updates to the 3D scene you should wake the animation before your update. It will timeout on its own so you don't have to worry about it. /sceneadd and /sceneremove do their own waking so you don't need to ask for it on those.",
            '/request3dObject' : "You can request the parent-most object that is showing in the 3D viewer. This is a THREE.js object that is generated by the 3D viewer. It contains all user elements shown in the scene. It does not contain the XYZ axis, toolhead, or other system elements. When you send this signal you will receive a publish back on /recv3dObject",
            '/requestUnits' : 'Send in this signal and you will be sent back a /recvUnits with a payload of "mm" or "inch" as a string. Please also see /unitsChanged in case you want to know whenever units are changed from a file open event. You can request what units the Gcode are in from the 3D Viewer. Since the 3D Viewer parses Gcode, it can determine the units. The 3D Viewer is mostly unit agnostic, however to draw the toolhead, grid, and extents labels it does need to know the units to draw the decorations in a somewhat appropriate size.'
        },
        foreignSubscribe: {
            "/com-chilipeppr-interface-cnccontroller/axes" : "If we see this signal come in, we move the toolhead to the xyz position in the payload of the signal.",
            "/com-chilipeppr-elem-dragdrop/ondropped" : "When a user drags and drops a file to the main window, we want to get notified so we can load it into the 3D viewer. During development mode in JSFiddle, this widget loads it's own com-chilipeppr-elem-dragdrop so you can test development, but when this widget is loaded in a full ChiliPeppr app it uses the global com-chilipeppr-elem-dragdrop."
        },
        //foreignPublish: {
        //},
        scene: null,
        object: null,
        camera: null,
        controls: null,
        toolhead: null,
        tween: null,
        tweenHighlight: null,
        tweenIndex: null,
        tweenSpeed: 1,
        tweenPaused: false,
        tweenIsPlaying: false,
        wantAnimate: true, // we automatically timeout rendering to save on cpu
        initOptions: {},
        init: function (initOptions) {
            this.initOptions = initOptions;
            var that = this;
            /*
             if (!Modernizr.webgl) {
             alert('Sorry, you need a WebGL capable browser to use this.\n\nGet the latest Chrome or FireFox.');
             return;
             }

             if (!Modernizr.localstorage) {
             alert("Man, your browser is ancient. I can't work with this. Please upgrade.");
             return;
             }
             */

            // Show 'About' dialog for first time visits.
            /*
             if (!localStorage.getItem("not-first-visit")) {
             localStorage.setItem("not-first-visit", true);
             setTimeout(about, 500);
             }
             */

            // Drop files from desktop onto main page to import them.
            // We also can subscribe to the main chilipeppr drag/drop
            // pubsub to get drop events from a parent, rather than doing
            // this on our own

            // subscribe to file load events
            chilipeppr.subscribe("/com-chilipeppr-elem-dragdrop/ondropped", this, this.onPubSubFileLoaded);

            if (this.initOptions && this.initOptions.doMyOwnDragDrop) {
                console.log("Doing my own drag drop for 3D viewer cuz asked to. Attaching to body tag in DOM.");
                $('body').on('dragover', function (event) {
                    event.stopPropagation();
                    event.preventDefault();
                    event.originalEvent.dataTransfer.dropEffect = 'copy'
                }).on('drop', function (event) {
                    console.log("got drop:", event);
                    event.stopPropagation();
                    event.preventDefault();
                    var files = event.originalEvent.dataTransfer.files;
                    if (files.length > 0) {
                        var reader = new FileReader();
                        reader.onload = function () {
                            console.log("opening file. reader:", reader);
                            that.openGCodeFromText(reader.result);
                        };
                        reader.readAsText(files[0]);
                    }
                });
            }

            that.scene = that.createScene($('#com-chilipeppr-widget-3dviewer-renderArea'));
            var lastImported = localStorage.getItem('last-imported');
            var lastLoaded = localStorage.getItem('last-loaded');
            if (lastImported) {
                that.openGCodeFromText(lastImported);
            } else {
                //console.log("would have opened octocat");
                //that.openGCodeFromPath(lastLoaded || 'examples/octocat.gcode');
                console.log("loading chilipeppr logo");
                that.openGCodeFromPath(lastLoaded || 'http://www.chilipeppr.com/3d/chilipepprlogo.nc');
            }

            // setup toolbar buttons
            this.btnSetup();

            this.forkSetup();
            //this.setDetails("blah");

            // subscribe to gotoline signal so we can move toolhead to correct location
            // to sync with the gcode sender
            chilipeppr.subscribe('/' + this.id + '/gotoline', this, this.gotoLine);

            // subscribe to gotoline signal so we can move toolhead to correct location
            // to sync with the actual milling machine
            chilipeppr.subscribe('/com-chilipeppr-interface-cnccontroller/axes', this, this.gotoXyz);

            // we can be asked to resize ourself by a publish call to this signal
            chilipeppr.subscribe('/' + this.id + '/resize', this, this.resize);

            // requestUnits, recvUnits
            chilipeppr.subscribe("/" + this.id + "/requestUnits", this, this.requestUnits);

            // setup more pubsub to allow other widgets to inject objects to our scene
            this.setupScenePubSub();

            this.setupGridSizeMenu();

        },
        setupScenePubSub: function() {
            // these pubsubs let others add objects to our 3d scene
            chilipeppr.subscribe("/" + this.id + "/wakeanimate", this, this.wakeAnimate);
            chilipeppr.subscribe("/" + this.id + "/sceneadd", this, this.sceneAdd);
            chilipeppr.subscribe("/" + this.id + "/sceneremove", this, this.sceneRemove);
            chilipeppr.subscribe("/" + this.id + "/request3dObject", this, this.request3dObject);
        },
        gridSize: 1, // global property for size of grid. default to 1 (shapeoko rough size)
        setupGridSizeMenu: function() {
            $('.com-chilipeppr-widget-3dviewer-gridsizing-1x').click(1, this.onGridSizeClick.bind(this));
            $('.com-chilipeppr-widget-3dviewer-gridsizing-2x').click(2, this.onGridSizeClick.bind(this));
            $('.com-chilipeppr-widget-3dviewer-gridsizing-5x').click(5, this.onGridSizeClick.bind(this));
            $('.com-chilipeppr-widget-3dviewer-gridsizing-10x').click(10, this.onGridSizeClick.bind(this));
        },
        onGridSizeClick: function(evt, param) {
            console.log("got onGridSizeClick. evt:", evt, "param:", param);
            var size = evt.data;
            this.gridSize = size;
            // redraw grid
            this.drawGrid();
        },
        requestUnits: function() {
            console.log("requestUnits");
            // we need to publish back the units
            var units = "mm";
            if (!this.isUnitsMm) units = "inch";
            chilipeppr.publish("/" + this.id + "/recvUnits", units);
        },
        onUnitsChanged: function() {
            //console.log("onUnitsChanged");
            // we need to publish back the units
            var units = "mm";
            if (!this.isUnitsMm) units = "inch";
            chilipeppr.publish("/" + this.id + "/unitsChanged", units);
        },
        request3dObject: function() {
            console.log("request3dObject");
            // we need to publish back the object
            chilipeppr.publish("/" + this.id + "/recv3dObject", this.object);
        },
        sceneAdd: function(obj) {
            console.log("sceneAdd. obj:", obj);
            this.wakeAnimate();
            this.scene.add(obj);
        },
        sceneRemove: function(obj) {
            console.log("sceneRemove. obj:", obj);
            this.wakeAnimate();
            this.scene.remove(obj);
        },
        btnSetup: function() {

            // attach button bar features
            var that = this;
            this.isLookAtToolHeadMode = true;
            $('.com-chilipeppr-widget-3d-menu-lookattoolhead').click(function () {
                if (that.isLookAtToolHeadMode) {
                    // turn off looking at toolhead
                    that.isLookAtToolHeadMode = false;
                    $('.com-chilipeppr-widget-3d-menu-lookattoolhead').removeClass("active btn-primary");
                } else {
                    // turn on looking at toolhead
                    that.isLookAtToolHeadMode = true;
                    that.lookAtToolHead();
                    $('.com-chilipeppr-widget-3d-menu-lookattoolhead').addClass("active btn-primary");
                }
            });
            $('.com-chilipeppr-widget-3d-menu-viewextents').click(function () {
                that.viewExtents()
            });
            $('.com-chilipeppr-widget-3d-menu-samplerun').click(function () {
                that.playSampleRun()
            });
            $('.com-chilipeppr-widget-3d-menu-samplerunstop').click(function () {
                that.stopSampleRun()
            });
            $('.com-chilipeppr-widget-3d-menu-samplerunspeed').click(function () {
                that.speedUp()
            });
            $('.com-chilipeppr-widget-3d-menu-samplerunpause').click(function () {
                that.pauseSampleRun()
            }).prop('disabled', true);
            $('.com-chilipeppr-widget-3d-menu-samplerunstop').prop('disabled', true);
            $('.btn').popover({
                animation: true,
                placement: "auto",
                trigger: "hover"
            });
        },
        forkSetup: function () {
            //$('#com-chilipeppr-widget-3dviewer .fork').prop('href', this.fiddleurl);
            //$('#com-chilipeppr-widget-3dviewer .standalone').prop('href', this.url);
            //var t = $('#com-chilipeppr-widget-3dviewer .fork-name');
            //t.html(this.id);
            $('#com-chilipeppr-widget-3dviewer .panel-title').popover({
                title: this.name,
                content: this.desc,
                html: true,
                delay: 200,
                animation: true
            });

            // load the pubsub viewer / fork element which decorates our upper right pulldown
            // menu with the ability to see the pubsubs from this widget and the forking links
            var that = this;
            chilipeppr.load("http://fiddle.jshell.net/chilipeppr/zMbL9/show/light/", function () {
                require(['inline:com-chilipeppr-elem-pubsubviewer'], function (pubsubviewer) {
                    pubsubviewer.attachTo($('#com-chilipeppr-widget-3dviewer-dropdown'), that);
                });
            });

            //console.log("title in menu", t);
        },
        onPubSubFileLoaded: function(txt) {
            this.openGCodeFromText(txt);
            chilipeppr.publish("/" + this.id + "/sceneReloaded", this.object.userData.bbbox2);
        },
        error: function (msg) {
            alert(msg);
        },
        loadFile: function (path, callback /* function(contents) */ ) {
            var that = this;
            $.get(path, null, callback, 'text')
                .error(function () {
                    that.error()
                });
        },
        setDetails: function(txt) {
            $('#com-chilipeppr-widget-3dviewer-renderArea .data-details').text(txt);
        },
        speedUp: function () {
            //var txt = $('.com-chilipeppr-widget-3d-menu-samplerunspeed').text();
            console.log("speedUp. tweenSpeed:", this.tweenSpeed);
            //var s = this.tweenSpeed;
            this.tweenSpeed = this.tweenSpeed * 10;
            if (this.tweenSpeed > 1024) this.tweenSpeed = 1;
            var txt = "x" + this.tweenSpeed;
            $('.com-chilipeppr-widget-3d-menu-samplerunspeed').text(txt);
        },
        openGCodeFromPath: function (path) {
            var that = this;
            //$('#openModal').modal('hide');
            if (that.object) {
                //TWEEN.removeAll();
                this.stopSampleRun();
                that.scene.remove(that.object);
                //that.scene.remove(that.decorate);
            }
            that.loadFile(path, function (gcode) {
                that.object = that.createObjectFromGCode(gcode);
                that.scene.add(that.object);
                that.viewExtents();
                //that.decorateExtents();
                that.drawAxesToolAndExtents();
                that.onUnitsChanged();
                localStorage.setItem('last-loaded', path);
                localStorage.removeItem('last-imported');
            });
        },
        openGCodeFromText: function (gcode) {
            console.log("openGcodeFromText");
            this.wakeAnimate();
            //$('#openModal').modal('hide');
            if (this.object) {
                //TWEEN.removeAll();
                this.stopSampleRun();
                this.scene.remove(this.object);
                //this.scene.remove(this.decorate);
            }
            this.object = this.createObjectFromGCode(gcode);
            console.log("done creating object:", this.object);
            this.scene.add(this.object);
            //this.lookAtCenter();
            this.viewExtents();
            //this.decorateExtents();
            this.drawAxesToolAndExtents();
            this.onUnitsChanged();
            this.setDetails(this.object.userData.lines.length + " GCode Lines");
            this.wakeAnimate();
            localStorage.setItem('last-imported', gcode);
            localStorage.removeItem('last-loaded');
        },
        lookAtCenter: function () {
            // this method makes the trackball controls look at center of gcode object
            this.controls.target.x = this.object.userData.center2.x;
            this.controls.target.y = this.object.userData.center2.y;
            this.controls.target.z = this.object.userData.center2.z;
        },
        isLookAtToolHeadMode: false,
        lookAtToolHead: function () {
            // this method makes the trackball controls look at the tool head
            //console.log("lookAtToolHead. controls:", this.controls, "toolhead:", this.toolhead);
            if (this.isLookAtToolHeadMode) {
                this.controls.target.x = this.toolhead.position.x;
                this.controls.target.y = this.toolhead.position.y;
                //this.controls.target.z = this.toolhead.position.z - 20;
                this.controls.target.z = this.toolhead.position.z;
            }
        },
        toCameraCoords: function (position) {
            return this.camera.matrixWorldInverse.multiplyVector3(position.clone());
        },
        scaleInView: function () {
            // NOT WORKING YET
            var tmp_fov = 0.0;

            for (var i = 0; i < 8; i++) {
                proj2d = this.toCameraCoords(boundbox.geometry.vertices[i]);

                angle = 114.59 * Math.max( // 2 * (Pi / 180)
                    Math.abs(Math.atan(proj2d.x / proj2d.z) / this.camera.aspect),
                    Math.abs(Math.atan(proj2d.y / proj2d.z)));
                tmp_fov = Math.max(tmp_fov, angle);
            }

            this.camera.fov = tmp_fov + 5; // An extra 5 degrees keeps all lines visible
            this.camera.updateProjectionMatrix();
        },
        viewExtents: function () {
            console.log("viewExtents. object.userData:", this.object.userData);
            console.log("controls:", this.controls);
            this.wakeAnimate();
            var ud = this.object.userData;
            //this.controls.enabled = false;
            this.controls.reset();
            //this.controls.object.rotation._x = 0.5;
            //this.controls.object.rotation._y = 0.5;
            //this.controls.object.rotation._z = 0.5;
            //this.controls.object.rotation = THREE.Euler(0.5, 0.5, 0.5);
            //this.controls.object.setRotationFromEuler(THREE.Euler(0.5,0.5,0.5));

            // get max of any of the 3 axes to use as max extent
            var lenx = Math.abs(ud.bbbox2.min.x) + ud.bbbox2.max.x;
            var leny = Math.abs(ud.bbbox2.min.y) + ud.bbbox2.max.y;
            var lenz = Math.abs(ud.bbbox2.min.z) + ud.bbbox2.max.z;
            var maxlen = Math.max(lenx, leny, lenz);
            var dist = 2 * maxlen;
            // center camera on gcode objects center pos, but twice the maxlen
            this.controls.object.position.x = ud.center2.x;
            this.controls.object.position.y = ud.center2.y;
            this.controls.object.position.z = ud.center2.z + dist;
            this.controls.target.x = ud.center2.x;
            this.controls.target.y = ud.center2.y;
            this.controls.target.z = ud.center2.z;
            console.log("maxlen:", maxlen, "dist:", dist);
            var fov = 2.2 * Math.atan(maxlen / (2 * dist)) * (180 / Math.PI);
            console.log("new fov:", fov, " old fov:", this.controls.object.fov);
            this.controls.object.fov = fov;
            //this.controls.object.setRotationFromEuler(THREE.Euler(0.5,0.5,0.5));
            //this.controls.object.rotation.set(0.5,0.5,0.5,"XYZ");
            //this.controls.object.rotateX(2);
            //this.controls.object.rotateY(0.5);

            var L = dist;
            var camera = this.controls.object;
            var vector = controls.target.clone();
            var l = (new THREE.Vector3()).subVectors(camera.position, vector).length();
            var up = camera.up.clone();
            var quaternion = new THREE.Quaternion();

            // Zoom correction
            camera.translateZ(L - l);
            console.log("up:", up);
            up.y = 1; up.x = 0; up.z = 0;
            quaternion.setFromAxisAngle(up, 0.5);
            //camera.position.applyQuaternion(quaternion);
            up.y = 0; up.x = 1; up.z = 0;
            quaternion.setFromAxisAngle(up, 0.5);
            camera.position.applyQuaternion(quaternion);
            up.y = 0; up.x = 0; up.z = 1;
            quaternion.setFromAxisAngle(up, 0.5);
            //camera.position.applyQuaternion(quaternion);

            camera.lookAt(vector);

            //this.camera.rotateX(90);

            this.controls.object.updateProjectionMatrix();
            //this.controls.enabled = true;
            //this.scaleInView();
            //this.controls.rotateCamera(0.5);
            //this.controls.noRoll = true;
            //this.controls.noRotate = true;
        },
        stopSampleRun: function (evt) {
            console.log("stopSampleRun. tween:", this.tween);
            this.tweenIsPlaying = false;
            //this.tween.stopChainedTweens();
            //console.log("_onCompleteCallback:", this.tween._onCompleteCallback);
            //this.tween._onCompleteCallback.apply(this.tween, null);
            if (this.tweenHighlight) this.scene.remove(this.tweenHighlight);
            if (this.tween) this.tween.stop();
            //TWEEN.stopChainedTweens();
            //TWEEN.removeAll();
            //TWEEN.stop();
            $('.com-chilipeppr-widget-3d-menu-samplerun').prop('disabled', false);
            $('.com-chilipeppr-widget-3d-menu-samplerunstop').prop('disabled', true);
            $('.com-chilipeppr-widget-3d-menu-samplerunstop').popover('hide');
            this.animAllowSleep();
        },
        pauseSampleRun: function () {
            console.log("pauseSampleRun");
            if (this.tweenPaused) {
                // the tween was paused, it's being non-paused
                console.log("unpausing tween");
                this.animNoSleep();
                this.tweenIsPlaying = true;
                this.tweenPaused = false;
                this.playNextTween();
            } else {
                console.log("pausing tween on next playNextTween()");
                this.tweenIsPlaying = false;
                this.tweenPaused = true;
                this.animAllowSleep();
            }
        },
        gotoXyz: function(data) {
            // we are sent this command by the CNC controller generic interface
            console.log("gotoXyz. data:", data);
            this.animNoSleep();
            this.tweenIsPlaying = false;
            this.tweenPaused = true;

            if ('x' in data && data.x != null) this.toolhead.position.x = data.x;
            if ('y' in data && data.y != null) this.toolhead.position.y = data.y;
            //if ('z' in data && data.z != null) this.toolhead.position.z = data.z + 20;
            if ('z' in data && data.z != null) this.toolhead.position.z = data.z;
            this.toolhead.children[0].target.position.set(this.toolhead.position.x, this.toolhead.position.y, this.toolhead.position.z);
            this.toolhead.children[1].target.position.set(this.toolhead.position.x, this.toolhead.position.y, this.toolhead.position.z);
            this.lookAtToolHead();
            this.animAllowSleep();
        },
        gotoLine: function(data) {
            // this method is sort of like playNextTween, but we are jumping to a specific
            // line based on the gcode sender
            console.log("got gotoLine. data:", data);
            //this.stopSampleRun();
            //this.tweenPaused = false;
            //this.pauseSampleRun();
            this.animNoSleep();
            this.tweenIsPlaying = false;
            this.tweenPaused = true;

            var lines = this.object.userData.lines;
            console.log("userData.lines:", lines[data.line]);
            var curLine = lines[data.line];
            var curPt = curLine.p2;
            //if (false && lines[data.line].p2) curPt = lines[data.line].p2;
            //else curPt = {x:0,y:0,z:0};
            console.log("p2 for toolhead move. curPt:", curPt);
            this.toolhead.position.x = curPt.x;
            this.toolhead.position.y = curPt.y;
            //this.toolhead.position.z = curPt.z + 20;
            this.toolhead.position.z = curPt.z;
            this.toolhead.children[0].target.position.set(this.toolhead.position.x, this.toolhead.position.y, this.toolhead.position.z);
            this.toolhead.children[1].target.position.set(this.toolhead.position.x, this.toolhead.position.y, this.toolhead.position.z);
            this.lookAtToolHead();
            this.animAllowSleep();

            /* GOOD STUFF BUT IF DON'T WANT ANIM*/
            if (this.tweenHighlight) this.scene.remove(this.tweenHighlight);
            if (this.tween) this.tween.stop();
            if (data.anim && data.anim == "anim") {
                console.log("being asking to animate gotoline");
                this.animNoSleep();
                this.tweenPaused = false;
                this.tweenIsPlaying = true;
                this.tweenIndex = data.line;
                this.playNextTween(true);
            }
        },
        playNextTween: function (isGotoLine) {

            if (this.tweenPaused) return;

            //this.wakeAnimate();

            var that = this;
            var lines = this.object.userData.lines;
            if (this.tweenIndex + 1 > lines.length - 1) {
                // done tweening
                console.log("Done with tween");
                this.stopSampleRun();
                return;
            }

            var lineMat = new THREE.LineBasicMaterial({
                color: 0xff0000,
                lineWidth: 1,
                transparent: true,
                opacity: 1,
            });

            // find next correct tween, i.e. ignore fake commands
            var isLooking = true;
            var indxStart = this.tweenIndex + 1;
            //console.log("starting while loop");
            while(isLooking) {
                if (indxStart > lines.length - 1) {
                    console.log("we are out of lines to look at");
                    that.stopSampleRun();
                    return;
                }
                if (lines[indxStart].args.isFake) {
                    // this is fake, skip it
                    //console.log("found fake line at indx:", indxStart);
                } else {
                    // we found a good one. use it
                    //console.log("found one at indx:", indxStart);
                    isLooking = false;
                    break;
                }
                indxStart++;
            }
            var ll;
            if (lines[this.tweenIndex].p2) ll = lines[this.tweenIndex].p2;
            else ll = {x:0,y:0,z:0};
            console.log("start line:", lines[this.tweenIndex], "ll:", ll);

            this.tweenIndex = indxStart;
            var cl = lines[this.tweenIndex].p2;
            console.log("end line:", lines[this.tweenIndex], " el:", cl);

            var curTween = new TWEEN.Tween({
                x: ll.x,
                y: ll.y,
                z: ll.z
            })
                .to({
                    x: cl.x,
                    y: cl.y,
                    z: cl.z
                }, 1000 / that.tweenSpeed)
                .onStart(function () {
                    that.tween = curTween;
                    //console.log("onStart");
                    // create a new line to show path
                    var lineGeo = new THREE.Geometry();
                    lineGeo.vertices.push(new THREE.Vector3(ll.x, ll.y, ll.z), new THREE.Vector3(cl.x, cl.y, cl.z));
                    var line = new THREE.Line(lineGeo, lineMat);
                    line.type = THREE.Lines;
                    that.tweenHighlight = line;
                    that.scene.add(line);

                })
                .onComplete(function () {
                    //console.log("onComplete");
                    that.scene.remove(that.tweenHighlight);
                    //setTimeout(function() {that.playNextTween();}, 0);
                    if (isGotoLine) {
                        console.log("got onComplete for tween and since isGotoLine mode we are stopping");
                        that.stopSampleRun();
                    } else {
                        that.playNextTween();
                    }
                })
                .onUpdate(function () {
                    that.toolhead.position.x = this.x;
                    that.toolhead.position.y = this.y;
                    that.toolhead.position.z = this.z;
                    //that.zheighttest -= 0.1;
                    //that.toolhead.position.z = this.z + that.zheighttest;
                    //that.toolhead.position.z = this.z + 20;
                    // update where shadow casting light is looking
                    that.toolhead.children[0].target.position.set(this.x, this.y, that.toolhead.position.z);
                    that.toolhead.children[1].target.position.set(this.x, this.y, that.toolhead.position.z);
                    //that.toolhead.children[0].target.matrixWorldNeedsUpdate = true;
                    //console.log("onUpdate2. toolhead:", that.toolhead);
                    that.lookAtToolHead();
                });
            //lastTween.chain(curTween);
            //lastTween = curTween;
            this.tween = curTween;
            //this.tweenIndex++;
            this.tween.start();
        },
        zheighttest: 0, // test toolhead going up in z
        playSampleRun: function (evt) {
            console.log("controls:", this.controls);
            //this.wakeAnimate();
            this.animNoSleep();
            $('.com-chilipeppr-widget-3d-menu-samplerun').prop('disabled', true);
            $('.com-chilipeppr-widget-3d-menu-samplerun').popover('hide');
            $('.com-chilipeppr-widget-3d-menu-samplerunstop').prop('disabled', false);
            $('.com-chilipeppr-widget-3d-menu-samplerunpause').prop('disabled', false);

            this.tweenPaused = false;
            this.tweenIsPlaying = true;
            this.tweenIndex = 0;

            var that = this;
            console.log("playSampleRun");
            //console.log("playSampleRun click:", evt, that);

            // cleanup previous run
            TWEEN.removeAll();

            // we will tween all gcode locs in order
            //var lines = this.object.userData.lines;
            //var pstart = this.object.userData.lines[0];
            var tween = new TWEEN.Tween({
                x: 0,
                y: 0,
                z: 0
            })
                .to({
                    x: 0,
                    y: 0,
                    z: 0
                }, 20)
                .easing(TWEEN.Easing.Quadratic.InOut)
                .onComplete(function () {
                    //console.log("onComplete");
                    that.playNextTween();
                })
                .onUpdate(function () {
                    that.toolhead.position.x = this.x;
                    that.toolhead.position.y = this.y;
                    //that.toolhead.position.z = this.z + 20;
                    that.toolhead.position.z = this.z;
                    // update where shadow casting light is looking
                    that.toolhead.children[0].target.position.set(this.x, this.y, that.toolhead.position.z);
                    that.toolhead.children[1].target.position.set(this.x, this.y, that.toolhead.position.z);

                    //that.toolhead.children[0].target.position.set(this.x, this.y, this.z);
                    //that.toolhead.children[0].target.matrixWorldNeedsUpdate = true;
                    //console.log("onUpdate. toolhead:", that.toolhead);
                });

            this.tween = tween;
            this.tweenIndex = 0;
            this.tween.start();

            /*
             //var mylines = this.object.userData.lines.slice
             lastTween = tween;
             var lineMat = new THREE.LineBasicMaterial({
             color: 0xFF0000,
             lineWidth: 1,
             blending: THREE.AdditiveBlending,
             transparent: true,
             opacity: 1,
             });
             $.each(this.object.userData.lines.slice(1), function(val, item) {
             //console.log(val,item);
             var ll = lines[val].p2;
             var cl = item.p2;
             //console.log(ll, cl);
             //var lineHighlight;
             var curTween = new TWEEN.Tween( { x: ll.x, y: ll.y, z: ll.z} )
             .to( {x: cl.x, y: cl.y, z: cl.z}, 1000 / that.tweenSpeed)
             //.easing( TWEEN.Easing.Quadratic.InOut )
             .onStart( function() {
             that.tween = curTween;
             //console.log("onStart");
             // create a new line to show path
             var lineGeo = new THREE.Geometry();
             lineGeo.vertices.push(new THREE.Vector3(ll.x, ll.y, ll.z), new THREE.Vector3(cl.x, cl.y, cl.z));
             var line = new THREE.Line(lineGeo, lineMat);
             line.type = THREE.Lines;
             that.tweenHighlight = line;
             that.scene.add(line);
             })
             .onComplete( function() {
             //console.log("onComplete");
             that.scene.remove(that.tweenHighlight);
             })
             .onUpdate( function () {
             that.toolhead.position.x = this.x;
             that.toolhead.position.y = this.y;
             that.toolhead.position.z = this.z + 20;
             that.lookAtToolHead();
             } );
             lastTween.chain(curTween);
             lastTween = curTween;
             });

             tween.start();
             */
        },
        makeText: function(vals) {
            var shapes, geom, mat, mesh;

            console.log("Do we have the global ThreeHelvetiker font:", ThreeHelvetiker);

            THREE.FontUtils.loadFace(ThreeHelvetiker);
            shapes = THREE.FontUtils.generateShapes( vals.text, {
                font: "helvetiker",
                //weight: "normal",
                size: vals.size ? vals.size : 10
            } );
            geom = new THREE.ShapeGeometry( shapes );
            mat = new THREE.MeshBasicMaterial({
                color: vals.color,
                transparent: true,
                opacity: 0.5,
            });
            mesh = new THREE.Mesh( geom, mat );

            mesh.position.x = vals.x;
            mesh.position.y = vals.y;
            mesh.position.z = vals.z;

            return mesh;

        },
        decorate: null, // stores the decoration 3d objects
        decorateExtents: function() {

            // remove grid if drawn previously
            if (this.decorate != null) {
                console.log("there was a previous extent decoration. remove it. grid:", this.decorate);
                this.sceneRemove(this.decorate);
            } else {
                console.log("no previous decorate extents.");
            }

            // get its bounding box
            var helper = new THREE.BoundingBoxHelper(this.object, 0xff0000);
            helper.update();
            this.bboxHelper = helper;
            // If you want a visible bounding box
            //this.scene.add(helper);
            console.log("helper bbox:", helper);

            var color = '#0d0d0d';
            //var color = '#ff0000';

            var material = new THREE.LineDashedMaterial({
                vertexColors: false, color: color,
                dashSize: this.getUnitVal(1), gapSize: this.getUnitVal(1), linewidth: 1,
                transparent: true,
                opacity: 0.5,
            });

            // Create X axis extents sprite
            var z = 0;
            var offsetFromY = this.getUnitVal(-4); // this means we'll be below the object by this padding
            var lenOfLine = this.getUnitVal(5);
            var minx = helper.box.min.x;
            var miny = helper.box.min.y;
            var maxx = helper.box.max.x;
            var maxy = helper.box.max.y;

            var lineGeo = new THREE.Geometry();
            lineGeo.vertices.push(
                new THREE.Vector3(minx, miny+offsetFromY, z),
                new THREE.Vector3(minx, miny+offsetFromY-lenOfLine, z),
                new THREE.Vector3(minx, miny+offsetFromY-lenOfLine, z),
                new THREE.Vector3(maxx, miny+offsetFromY-lenOfLine, z),
                new THREE.Vector3(maxx, miny+offsetFromY-lenOfLine, z),
                new THREE.Vector3(maxx, miny+offsetFromY, z)

            );
            lineGeo.computeLineDistances();
            var line = new THREE.Line(lineGeo, material, THREE.LinePieces);
            line.type = THREE.Lines;

            // Draw text label of length
            var txt = (maxx - minx).toFixed(2);
            txt += (this.isUnitsMm) ? " mm" : " in";
            var txtX = this.makeText({
                x: minx + this.getUnitVal(1),
                y: miny + offsetFromY - lenOfLine - this.getUnitVal(3),
                z: z,
                text: txt,
                color: color,
                size: this.getUnitVal(2)
            });

            // Create Y axis extents sprite
            var offsetFromX = this.getUnitVal(-4); // this means we'll be below the object by this padding

            var lineGeo2 = new THREE.Geometry();
            lineGeo2.vertices.push(
                new THREE.Vector3(minx + offsetFromX, miny, z),
                new THREE.Vector3(minx + offsetFromX - lenOfLine, miny, z),
                new THREE.Vector3(minx + offsetFromX - lenOfLine, miny, z),
                new THREE.Vector3(minx + offsetFromX - lenOfLine, maxy, z),
                new THREE.Vector3(minx + offsetFromX - lenOfLine, maxy, z),
                new THREE.Vector3(minx + offsetFromX, maxy, z)
            );
            lineGeo2.computeLineDistances();
            var line2 = new THREE.Line(lineGeo2, material, THREE.LinePieces);
            line2.type = THREE.Lines;

            // Draw text label of length
            var txt = (maxy - miny).toFixed(2);
            txt += (this.isUnitsMm) ? " mm" : " in";
            var txtY = this.makeText({
                x: minx + offsetFromX - lenOfLine,
                y: miny - this.getUnitVal(3),
                z: z,
                text: txt,
                color: color,
                size: this.getUnitVal(2)
            });

            // draw lines on X axis to represent width
            // create group to put everything into
            this.decorate = new THREE.Object3D();
            this.decorate.add(line);
            this.decorate.add(txtX);
            this.decorate.add(line2);
            this.decorate.add(txtY);

            this.sceneAdd(this.decorate);
            console.log("just added decoration:", this.decorate);

        },
        makeSprite: function (scene, rendererType, vals) {
            var canvas = document.createElement('canvas'),
                context = canvas.getContext('2d'),
                metrics = null,
                textHeight = 100,
                textWidth = 0,
                actualFontSize = this.getUnitVal(10);
            var txt = vals.text;
            if (vals.size) actualFontSize = vals.size;

            context.font = "normal " + textHeight + "px Arial";
            metrics = context.measureText(txt);
            var textWidth = metrics.width;

            canvas.width = textWidth;
            canvas.height = textHeight;
            context.font = "normal " + textHeight + "px Arial";
            context.textAlign = "center";
            context.textBaseline = "middle";
            //context.fillStyle = "#ff0000";
            context.fillStyle = vals.color;

            context.fillText(txt, textWidth / 2, textHeight / 2);

            var texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;

            var material = new THREE.SpriteMaterial({
                map: texture,
                useScreenCoordinates: false
            });
            material.transparent = true;
            //var textObject = new THREE.Sprite(material);
            var textObject = new THREE.Object3D();
            textObject.position.x = vals.x;
            textObject.position.y = vals.y;
            textObject.position.z = vals.z;
            var sprite = new THREE.Sprite(material);
            textObject.textHeight = actualFontSize;
            textObject.textWidth = (textWidth / textHeight) * textObject.textHeight;
            if (rendererType == "2d") {
                sprite.scale.set(textObject.textWidth / textWidth, textObject.textHeight / textHeight, 1);
            } else {
                sprite.scale.set(textWidth / textHeight * actualFontSize, actualFontSize, 1);
            }

            textObject.add(sprite);

            //scene.add(textObject);
            return textObject;
        },
        element: null,
        isUnitsMm: true, // true for mm, false for inches
        getInchesFromMm: function(mm) {
            return mm * 0.0393701;
        },
        getUnitVal: function(val) {
            // if drawing untis is mm just return cuz default
            if (this.isUnitsMm) return val;
            // if drawing is in inches convert
            return this.getInchesFromMm(val);
        },
        drawAxesToolAndExtents: function() {

            //return;
            // these are drawn after the gcode is rendered now
            // so we can see if in inch or mm mode
            // these items scale based on that mode
            this.drawToolhead();
            this.drawGrid();
            this.drawExtentsLabels();
            this.drawAxes();
        },
        shadowplane: null,
        drawToolhead: function() {

            // remove grid if drawn previously
            if (this.toolhead != null) {
                console.log("there was a previous toolhead. remove it. toolhead:", this.toolhead, "shadowplane:", this.shadowplane);
                this.sceneRemove(this.shadowplane);
                this.sceneRemove(this.toolhead);
            } else {
                console.log("no previous toolhead or shadowplane.");
            }

            // TOOLHEAD WITH SHADOW
            var toolheadgrp = new THREE.Object3D();

            // SHADOWS
            var light = new THREE.DirectionalLight(0xffffff);
            //var light = new THREE.SpotLight(0xffffff);
            light.position.set(0, 60, 60);
            //light.rotation.x = 90 * Math.PI / 180;
            //light.lookat(
            //light.target.position.set(0, 0, 0);
            light.castShadow = true;
            light.onlyShadow = true;
            light.shadowDarkness = 0.05;
            //light.shadowCameraVisible = true; // only for debugging
            // these six values define the boundaries of the yellow box seen above
            light.shadowCameraNear = 0;
            light.shadowCameraFar = this.getUnitVal(1000);
            light.shadowCameraLeft = this.getUnitVal(-5);
            light.shadowCameraRight = this.getUnitVal(5);
            light.shadowCameraTop = 0;
            light.shadowCameraBottom = this.getUnitVal(-35);
            //scene.add(light);
            toolheadgrp.add(light);

            var light2 = light.clone();
            light2.position.set(60, 0, 60);
            light2.shadowCameraLeft = 0; //-5;
            light2.shadowCameraRight = this.getUnitVal(-35); //5;
            light2.shadowCameraTop = this.getUnitVal(-5); //0;
            light2.shadowCameraBottom = this.getUnitVal(5); //-35;
            light2.shadowDarkness = 0.03;
            //light2.rotation.z = 90 * Math.PI / 180;
            toolheadgrp.add(light2);

            // ToolHead Cylinder
            // API: THREE.CylinderGeometry(bottomRadius, topRadius, height, segmentsRadius, segmentsHeight)
            var cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0, 5, 40, 15, 1, false), new THREE.MeshNormalMaterial());
            cylinder.overdraw = true;
            cylinder.rotation.x = -90 * Math.PI / 180;
            cylinder.position.z = 20;
            //cylinder.position.z = 40;
            cylinder.material.opacity = 0.5;
            cylinder.material.transparent = true;
            cylinder.castShadow = true;
            //cylinder.receiveShadow = true;
            console.log("toolhead cone:", cylinder);
            //scene.add(cylinder);

            //light.shadowCamera.lookAt(cylinder);
            toolheadgrp.add(cylinder);

            // mesh plane to receive shadows
            var planeFragmentShader = [

                "uniform vec3 diffuse;",
                "uniform float opacity;",

                //THREE.ShaderChunk[ "color_pars_fragment" ],
                //THREE.ShaderChunk[ "map_pars_fragment" ],
                //THREE.ShaderChunk[ "lightmap_pars_fragment" ],
                //THREE.ShaderChunk[ "envmap_pars_fragment" ],
                //THREE.ShaderChunk[ "fog_pars_fragment" ],
                THREE.ShaderChunk[ "shadowmap_pars_fragment" ],
                //THREE.ShaderChunk[ "specularmap_pars_fragment" ],

                "void main() {",

                "gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 );",

                //THREE.ShaderChunk[ "map_fragment" ],
                //THREE.ShaderChunk[ "alphatest_fragment" ],
                //THREE.ShaderChunk[ "specularmap_fragment" ],
                //THREE.ShaderChunk[ "lightmap_fragment" ],
                //THREE.ShaderChunk[ "color_fragment" ],
                //THREE.ShaderChunk[ "envmap_fragment" ],
                THREE.ShaderChunk[ "shadowmap_fragment" ],
                //THREE.ShaderChunk[ "linear_to_gamma_fragment" ],
                //THREE.ShaderChunk[ "fog_fragment" ],

                "gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 - shadowColor.x );",

                "}"

            ].join("\n");

            var planeMaterial = new THREE.ShaderMaterial({
                uniforms: THREE.ShaderLib['basic'].uniforms,
                vertexShader: THREE.ShaderLib['basic'].vertexShader,
                fragmentShader: planeFragmentShader,
                color: 0x0000FF, transparent: true
            });

            var planeW = 50; // pixels
            var planeH = 50; // pixels
            var numW = 50; // how many wide (50*50 = 2500 pixels wide)
            var numH = 50; // how many tall (50*50 = 2500 pixels tall)
            var plane = new THREE.Mesh( new THREE.PlaneGeometry( planeW*50, planeH*50, planeW, planeH ), new   THREE.MeshLambertMaterial( { color: 0xffffff, wireframe: false, transparent: true, opacity: 0.5 } ) );
            var plane = new THREE.Mesh( new THREE.PlaneGeometry( planeW*50, planeH*50, planeW, planeH ), planeMaterial );
            //plane.castShadow = false;
            plane.position.z = 0;
            plane.receiveShadow = true;

            console.log("toolhead plane:", plane);
            //scene.add(plane);
            //toolheadgrp.add(plane);

            // scale the whole thing to correctly match mm vs inches
            var scale = this.getUnitVal(1);
            plane.scale.set(scale, scale, scale);
            toolheadgrp.scale.set(scale, scale, scale);

            this.toolhead = toolheadgrp;
            this.shadowplane = plane;
            this.sceneAdd(this.shadowplane);
            this.sceneAdd(this.toolhead);

        },
        grid: null, // stores grid
        drawGrid: function() {

            // remove grid if drawn previously
            if (this.grid != null) {
                console.log("there was a previous grid. remove it. grid:", this.grid);
                this.sceneRemove(this.grid);
            } else {
                console.log("no previous grid.");
            }

            // will get mm or inches for grid
            var widthHeightOfGrid; //= this.getUnitVal(200);
            var subSectionsOfGrid; //= this.getUnitVal(10);
            if (this.isUnitsMm) {
                widthHeightOfGrid = 200; // 200 mm grid should be reasonable
                subSectionsOfGrid = 10; // 10mm (1 cm) is good for mm work
            } else {
                widthHeightOfGrid = 20; // 20 inches is good
                subSectionsOfGrid = 1; // 1 inch grid is nice
            }

            // see if user wants to size up grid. default is size 1
            // so this won't modify size based on default
            widthHeightOfGrid = widthHeightOfGrid * this.gridSize;

            // draw grid
            var helper = new THREE.GridHelper(widthHeightOfGrid, subSectionsOfGrid);
            helper.setColors(0x0000ff, 0x808080);
            helper.position.y = 0;
            helper.position.x = 0;
            helper.position.z = 0;
            helper.rotation.x = 90 * Math.PI / 180;
            helper.material.opacity = 0.2;
            helper.material.transparent = true;
            helper.receiveShadow = false;
            console.log("helper grid:", helper);
            this.grid = helper;
            this.sceneAdd(this.grid);
            //this.scene.add(helper);

        },
        drawExtentsLabels: function() {
            this.decorateExtents();
        },
        axes: null, // global property to store axes that we drew
        drawAxes: function() {

            // remove axes if they were drawn previously
            if (this.axes != null) {
                console.log("there was a previous axes. remove it. axes:", this.axes);
                this.sceneRemove(this.axes);
            } else {
                console.log("no previous axes to remove. cool.");
            }

            // axes
            var axesgrp = new THREE.Object3D();

            axes = new THREE.AxisHelper(this.getUnitVal(100));
            //this.scene.add(axes);
            axesgrp.add(axes);

            // add axes labels
            var xlbl = this.makeSprite(this.scene, "webgl", {
                x: this.getUnitVal(110),
                y: 0,
                z: 0,
                text: "X",
                color: "#ff0000"
            });
            var ylbl = this.makeSprite(this.scene, "webgl", {
                x: 0,
                y: this.getUnitVal(110),
                z: 0,
                text: "Y",
                color: "#00ff00"
            });
            var zlbl = this.makeSprite(this.scene, "webgl", {
                x: 0,
                y: 0,
                z: this.getUnitVal(110),
                text: "Z",
                color: "#0000ff"
            });

            axesgrp.add(xlbl);
            axesgrp.add(ylbl);
            axesgrp.add(zlbl);
            this.axes = axesgrp;
            this.sceneAdd(this.axes);

        },
        createScene: function (element) {

            console.log("inside createScene: element:", element);
            if (!Detector.webgl) Detector.addGetWebGLMessage();

            // store element on this object
            this.element = element;

            // Scene
            var scene = new THREE.Scene();
            this.scene = scene;

            // Lights...
            var ctr = 0;
            [
                [0, 0, 1, 0xFFFFCC],
                [0, 1, 0, 0xFFCCFF],
                [1, 0, 0, 0xCCFFFF],
                [0, 0, -1, 0xCCCCFF],
                [0, -1, 0, 0xCCFFCC],
                [-1, 0, 0, 0xFFCCCC]
            ].forEach(function (position) {
                    var light = new THREE.DirectionalLight(position[3]);
                    light.position.set(position[0], position[1], position[2]).normalize();
                    /*if (ctr == 0) {
                     light.castShadow = true;
                     light.shadowDarkness = 0.95;
                     light.shadowCameraRight     =  5;
                     light.shadowCameraLeft     = -5;
                     light.shadowCameraTop      =  5;
                     light.shadowCameraBottom   = -5;
                     light.shadowCameraVisible = true;
                     }*/
                    scene.add(light);
                    ctr++;
                });

            // Camera...
            var fov = 45,
                aspect = element.width() / element.height(),
                near = 0.0000000001,
                far = 10000000,
                camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
            this.camera = camera;
            camera.rotationAutoUpdate = true;
            camera.position.x = 10;
            camera.position.y = -100;
            camera.position.z = 200;
            scene.add(camera);

            // Controls
            //var mouseEvtContainer = $('#com-chilipeppr-widget-3dviewer-renderArea');
            //console.log(mouseEvtContainer);
            //controls = new THREE.TrackballControls(camera, mouseEvtContainer[0]);
            controls = new THREE.TrackballControls(camera, element[0]);
            this.controls = controls; // set property for later use
            //controls = new THREE.OrbitControls(camera);
            controls.noPan = false;
            controls.dynamicDampingFactor = 0.15;
            //controls.staticMoving = true;
            //controls.target.x = 50;
            //controls.target.y = 100;
            //controls.autoRotate = true;
            console.log("controls:", controls);
            //controls.target.z = 100;
            //controls.addEventListener( 'change', render );

            // Renderer
            /*
             var renderer = new THREE.WebGLRenderer({
             clearColor: 0x000000,
             clearAlpha: 1
             });
             */
            var renderer = new THREE.WebGLRenderer({
                antialias: true,
                preserveDrawingBuffer: false,
                alpha: false
            });
            this.renderer = renderer;
            //renderer.setClearColor( scene.fog.color, 1 );
            renderer.setClearColor(0xeeeeee, 1);
            renderer.setSize(element.width(), element.height());
            element.append(renderer.domElement);
            //renderer.autoClear = true;
            //renderer.clear();

            // cast shadows
            renderer.shadowMapEnabled = true;
            // to antialias the shadow
            renderer.shadowMapSoft = true;
            /*
             renderer.shadowCameraNear = 3;
             renderer.shadowCameraFar = camera.far;
             renderer.shadowCameraFov = 50;
             */
            /*
             renderer.shadowMapBias = 0.0039;
             renderer.shadowMapDarkness = 1.0;
             renderer.shadowMapWidth = 1024;
             renderer.shadowMapHeight = 1024;
             */

            // Arrow Helper
            /*
             var dir = new THREE.Vector3( 1, 0, 0 );
             var origin = new THREE.Vector3( 0, 0, 0 );
             var length = 100;
             var hex = 0xffff00;

             var arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
             scene.add( arrowHelper );
             */

            //scene.add( new THREE.PointLightHelper( light, 5 ) );
            // Show grid

            /* MOVED TO METHOD
             var helper = new THREE.GridHelper(200, 10);
             helper.setColors(0x0000ff, 0x808080);
             helper.position.y = 0;
             helper.position.x = 0;
             helper.position.z = 0;
             helper.rotation.x = 90 * Math.PI / 180;
             helper.material.opacity = 0.2;
             helper.material.transparent = true;
             helper.receiveShadow = true;
             console.log("helper:", helper);
             scene.add(helper);
             */
            //this.drawGrid();

            /* MOVED TO METHOD
             // TOOLHEAD WITH SHADOW
             var toolheadgrp = new THREE.Object3D();

             // SHADOWS
             var light = new THREE.DirectionalLight(0xffffff);
             //var light = new THREE.SpotLight(0xffffff);
             light.position.set(0, 60, 60);
             //light.rotation.x = 90 * Math.PI / 180;
             //light.lookat(
             //light.target.position.set(0, 0, 0);
             light.castShadow = true;
             light.onlyShadow = true;
             light.shadowDarkness = 0.05;
             //light.shadowCameraVisible = true; // only for debugging
             // these six values define the boundaries of the yellow box seen above
             light.shadowCameraNear = 0;
             light.shadowCameraFar = 1000;
             light.shadowCameraLeft = -5;
             light.shadowCameraRight = 5;
             light.shadowCameraTop = 0;
             light.shadowCameraBottom = -35;
             //scene.add(light);
             toolheadgrp.add(light);

             var light2 = light.clone();
             light2.position.set(60, 0, 60);
             light2.shadowCameraLeft = 0; //-5;
             light2.shadowCameraRight = -35; //5;
             light2.shadowCameraTop = -5; //0;
             light2.shadowCameraBottom = 5; //-35;
             light2.shadowDarkness = 0.03;
             //light2.rotation.z = 90 * Math.PI / 180;
             toolheadgrp.add(light2);

             // ToolHead Cylinder
             // API: THREE.CylinderGeometry(bottomRadius, topRadius, height, segmentsRadius, segmentsHeight)
             var cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0, 5, 40, 15, 1, false), new THREE.MeshNormalMaterial());
             cylinder.overdraw = true;
             cylinder.rotation.x = -90 * Math.PI / 180;
             cylinder.position.z = 20;
             //cylinder.position.z = 40;
             cylinder.material.opacity = 0.5;
             cylinder.material.transparent = true;
             cylinder.castShadow = true;
             //cylinder.receiveShadow = true;
             console.log("toolhead cone:", cylinder);
             //scene.add(cylinder);

             //light.shadowCamera.lookAt(cylinder);

             toolheadgrp.add(cylinder);

             this.toolhead = toolheadgrp;
             scene.add(toolheadgrp);
             */
            //this.drawToolhead();


            /*
             // sparks
             var particleGroup = new SPE.Group({
             texture: '',
             maxAge: 1,
             colorize: 1,
             transparent: 1,
             alphaTest: 0.5,
             depthWrite: false,
             depthTest: true,
             blending: THREE.NormalBlending
             });

             var emitter = new SPE.Emitter({
             position: new THREE.Vector3(0, 0, 0),
             positionSpread: new THREE.Vector3( 0, 0, 1 ),

             acceleration: new THREE.Vector3(0, -1, 0),
             accelerationSpread: new THREE.Vector3( 1, 0, 1 ),

             velocity: new THREE.Vector3(0, 0, 1),
             velocitySpread: new THREE.Vector3(1, 1, 1),

             colorStart: new THREE.Color('red'),
             colorEnd: new THREE.Color('blue'),
             opacityStart: 0,
             opacityStartSpread: 0,
             opacityMiddle: 0.5,
             opacityMiddleSpread: 0,
             opacityEnd: 1,
             opacityEndSpread: 1,

             sizeStart: 0.01,
             sizeEnd: 0.5,

             particleCount: 5
             });

             particleGroup.addEmitter( emitter );
             var clock = new THREE.Clock();
             scene.add( particleGroup.mesh );
             */

            /* MOVED TO METHOD
             // axes
             axes = new THREE.AxisHelper(100);
             scene.add(axes);

             // add axes labels
             this.makeSprite(scene, "webgl", {
             x: 110,
             y: 0,
             z: 0,
             text: "X",
             color: "#ff0000"
             });
             this.makeSprite(scene, "webgl", {
             x: 0,
             y: 110,
             z: 0,
             text: "Y",
             color: "#00ff00"
             });
             this.makeSprite(scene, "webgl", {
             x: 0,
             y: 0,
             z: 110,
             text: "Z",
             color: "#0000ff"
             });
             */
            //this.drawAxes();

            // Action!
            //controls.addEventListener( 'change', test );
            //element.on('change', test);
            var mouseEvtContainer = $('#com-chilipeppr-widget-3dviewer-renderArea');
            console.log(mouseEvtContainer);
            //mouseEvtContainer.on('mousemove mousedown mousewheel hover click dblclick scroll touchstart touchmove touchenter focus resize', this.wakeAnimate.bind(this));
            //controls.addEventListener( 'change', this.wakeAnimate.bind(this));
            controls.addEventListener( 'start', this.animNoSleep.bind(this));
            controls.addEventListener( 'end', this.animAllowSleep.bind(this));
            //mouseEvtContainer.on('', wakeAnimate);
            /*
             function test(evt) {
             console.log("got event listener", evt);
             }
             function slowDown() {
             requestAnimationFrame(animate); // And repeat...
             }
             */
            console.log("this wantAnimate:", this);
            this.wantAnimate = true;
            //this.camera = camera;
            //var that = this;
            /*
             function animate() {
             TWEEN.update();
             //setTimeout(slowDown, 100);
             if (that.wantAnimate) requestAnimationFrame(animate); // And repeat...
             controls.update();
             // Use a fixed time-step here to avoid gaps
             //render( clock.getDelta() );
             //render();
             renderer.render(scene, camera);
             }
             */

            //setTimeout(this.sleepAnimate, 5000);

            /*
             function render2(dt) {
             //controls.update();
             //particleGroup.tick( dt );
             renderer.render(scene, camera);
             //console.log(camera);
             //TWEEN.update();
             requestAnimationFrame(render); // And repeat...
             //stats.update();
             }
             */
            //render( clock.getDelta() );
            //setTimeout(animate, 0);
            //render();
            //animate();
            //this.animate();
            this.wakeAnimate();

            // Fix coordinates up if window is resized.
            var that = this;
            $(window).on('resize', function () {
                //console.log("got resize event. resetting aspect ratio.");
                renderer.setSize(element.width(), element.height());
                camera.aspect = element.width() / element.height();
                camera.updateProjectionMatrix();
                controls.screen.width = window.innerWidth;
                controls.screen.height = window.innerHeight;
                that.wakeAnimate();
                //render();
            });

            return scene;
        },
        resize: function() {
            //console.log("got resize event. resetting aspect ratio.");
            this.renderer.setSize(this.element.width(), this.element.height());
            this.camera.aspect = this.element.width() / this.element.height();
            this.camera.updateProjectionMatrix();
            this.controls.screen.width = window.innerWidth;
            this.controls.screen.height = window.innerHeight;
            this.wakeAnimate();
        },
        mytimeout: null,
        animate: function() {
            TWEEN.update();
            if (this.wantAnimate) {
                requestAnimationFrame(this.animate.bind(this));
            }
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        },
        wakeAnimate: function(evt) {
            //console.log("wakeAnimate:", evt);
            this.wantAnimate = true;
            //controls.update();
            //clearTimeout(this.mytimeout);
            if (!this.mytimeout) {
                this.mytimeout = setTimeout(this.sleepAnimate.bind(this), 10000);
                //console.log("wakeAnimate");
                requestAnimationFrame(this.animate.bind(this));
            }
        },
        sleepAnimate: function() {
            this.mytimeout = null;
            if (this.isNoSleepMode) {
                // skip sleeping the anim
                console.log("Being asked to sleep anim, but in NoSleepMode");
            } else {
                this.wantAnimate = false;
                console.log("slept animate");
            }
        },
        cancelSleep: function() {
            clearTimeout(this.mytimeout);
        },
        isNoSleepMode: false,
        animNoSleep: function() {
            //console.log("anim no sleep");
            this.isNoSleepMode = true;
            //this.cancelSleep();
            this.wakeAnimate();
        },
        animAllowSleep: function() {
            //console.log("anim allow sleep");

            // even if we're being asked to allow sleep
            // but the tween is playing, don't allow it
            if (this.tweenIsPlaying) return;

            // if we get here, then allow sleep
            this.isNoSleepMode = false;
            if (!this.mytimeout) this.mytimeout = setTimeout(this.sleepAnimate.bind(this), 5000);
        },
        /**
         * Parses a string of gcode instructions, and invokes handlers for
         * each type of command.
         *
         * Special handler:
         *   'default': Called if no other handler matches.
         */
        GCodeParser: function (handlers) {
            this.handlers = handlers || {};

            this.lastArgs = {cmd: null};

            this.parseLine = function (text, info) {
                //text = text.replace(/;.*$/, '').trim(); // Remove comments
                //text = text.replace(/\(.*$/, '').trim(); // Remove comments
                //text = text.replace(/<!--.*?-->/, '').trim(); // Remove comments

                var origtext = text;
                // remove line numbers if exist
                if (text.match(/^N/i)) {
                    // yes, there's a line num
                    text = text.replace(/^N\d+\s*/ig, "");
                }

                // collapse leading zero g cmds to no leading zero
                text = text.replace(/G00/i, 'G0');
                text = text.replace(/G0(\d)/i, 'G$1');
                // add spaces before g cmds and xyzabcijk params
                text = text.replace(/([gmtxyzabcijk])/ig, " $1");
                // remove spaces after xyzabcijk params because a number should be directly after them
                text = text.replace(/([xyzabcijkfst])\s+/ig, "$1");
                // remove front and trailing space
                text = text.trim();

                // see if comment
                var isComment = false;
                if (text.match(/^(;|\(|<)/)) {
                    text = origtext;
                    isComment = true;
                } else {
                    // make sure to remove inline comments
                    text = text.replace(/\(.*?\)/g, "");
                }
                //console.log("gcode txt:", text);

                if (text && !isComment) {
                    //console.log("there is txt and it's not a comment");
                    //console.log("");
                    // preprocess XYZIJ params to make sure there's a space
                    //text = text.replace(/(X|Y|Z|I|J|K)/ig, "$1 ");
                    //console.log("gcode txt:", text);

                    // strip off end of line comment
                    text = text.replace(/(;|\().*$/, ""); // ; or () trailing
                    //text = text.replace(/\(.*$/, ""); // () trailing

                    var tokens = text.split(/\s+/);
                    //console.log("tokens:", tokens);
                    if (tokens) {
                        var cmd = tokens[0];
                        cmd = cmd.toUpperCase();
                        // check if a g or m cmd was included in gcode line
                        // you are allowed to just specify coords on a line
                        // and it should be assumed that the last specified gcode
                        // cmd is what's assumed
                        isComment = false;
                        if (!cmd.match(/^(G|M|T)/i)) {
                            // if comment, drop it
                            /*
                             if (cmd.match(/(;|\(|<)/)) {
                             // is comment. do nothing.
                             isComment = true;
                             text = origtext;
                             //console.log("got comment:", cmd);
                             } else {
                             */

                            //console.log("no cmd so using last one. lastArgs:", this.lastArgs);
                            // we need to use the last gcode cmd
                            cmd = this.lastArgs.cmd;
                            //console.log("using last cmd:", cmd);
                            tokens.unshift(cmd); // put at spot 0 in array
                            //console.log("tokens:", tokens);
                            //}
                        } else {

                            // we have a normal cmd as opposed to just an xyz pos where
                            // it assumes you should use the last cmd
                            // however, need to remove inline comments (TODO. it seems parser works fine for now)

                        }
                        var args = {
                            'cmd': cmd,
                            'text': text,
                            'origtext': origtext,
                            'indx': info,
                            'isComment': isComment
                        };

                        //console.log("args:", args);
                        if (tokens.length > 1  && !isComment) {
                            tokens.splice(1).forEach(function (token) {
                                //console.log("token:", token);
                                if (token && token.length > 0) {
                                    var key = token[0].toLowerCase();
                                    var value = parseFloat(token.substring(1));
                                    //console.log("value:", value, "key:", key);
                                    //if (isNaN(value))
                                    //    console.error("got NaN. val:", value, "key:", key, "tokens:", tokens);
                                    args[key] = value;
                                } else {
                                    //console.log("couldn't parse token in foreach. weird:", token);
                                }
                            });
                        }
                        var handler = this.handlers[cmd] || this.handlers['default'];

                        // don't save if saw a comment
                        if (!args.isComment) {
                            this.lastArgs = args;
                            //console.log("just saved lastArgs for next use:", this.lastArgs);
                        } else {
                            //console.log("this was a comment, so didn't save lastArgs");
                        }
                        //console.log("calling handler: ", cmd, ", args:", args);
                        if (handler) {

                            return handler(args, info, this);
                        } else {
                            console.error("No handler for gcode command!!!");
                        }

                    }
                } else {
                    // it was a comment or the line was empty
                    // we still need to create a segment with xyz in p2
                    // so that when we're being asked to /gotoline we have a position
                    // for each gcode line, even comments. we just use the last real position
                    // to give each gcode line (even a blank line) a spot to go to
                    var args = {
                        'cmd': 'empty or comment',
                        'text': text,
                        'origtext': origtext,
                        'indx': info,
                        'isComment': isComment
                    };
                    var handler = this.handlers['default'];
                    return handler(args, info, this);
                }
            }

            this.parse = function (gcode) {
                var lines = gcode.split(/\r{0,1}\n/);
                for (var i = 0; i < lines.length; i++) {
                    if (this.parseLine(lines[i], i) === false) {
                        break;
                    }
                }
            }
        },
        createObjectFromGCode: function (gcode, indxMax) {
            //debugger;
            // Credit goes to https://github.com/joewalnes/gcode-viewer
            // for the initial inspiration and example code.
            //
            // GCode descriptions come from:
            //    http://reprap.org/wiki/G-code
            //    http://en.wikipedia.org/wiki/G-code
            //    SprintRun source code

            // these are extra Object3D elements added during
            // the gcode rendering to attach to scene
            this.extraObjects = [];

            var lastLine = {
                x: 0,
                y: 0,
                z: 0,
                e: 0,
                f: 0,
                extruding: false
            };

            var layers = [];
            var layer = undefined;
            var lines = [];
            var bbbox = {
                min: {
                    x: 100000,
                    y: 100000,
                    z: 100000
                },
                max: {
                    x: -100000,
                    y: -100000,
                    z: -100000
                }
            };
            var bbbox2 = {
                min: {
                    x: 100000,
                    y: 100000,
                    z: 100000
                },
                max: {
                    x: -100000,
                    y: -100000,
                    z: -100000
                }
            };

            this.newLayer = function (line) {
                //console.log("layers:", layers, "layers.length", layers.length);

                layer = {
                    type: {},
                    layer: layers.length,
                    z: line.z,
                };
                layers.push(layer);
            };

            this.getLineGroup = function (line, args) {
                //console.log("getLineGroup:", line);
                if (layer == undefined) this.newLayer(line);
                var speed = Math.round(line.e / 1000);
                var grouptype = (line.extruding ? 10000 : 0) + speed;
                var color = new THREE.Color(line.extruding ? 0xff00ff : 0x0000ff);
                if (line.g0) {
                    grouptype = "g0";
                    color = new THREE.Color(0x00ff00);
                } else if (line.g2) {
                    grouptype = "g2";
                    color = new THREE.Color(0x999900);
                } else if (line.arc) {
                    grouptype = "arc";
                    color = new THREE.Color(0x0099ff);
                }
                // see if we have reached indxMax, if so draw, but
                // make it ghosted
                if (args.indx > indxMax) {
                    grouptype = "ghost";
                    //console.log("args.indx > indxMax", args, indxMax);
                    color = new THREE.Color(0x000000);
                }
                //if (line.color) color = new THREE.Color(line.color);
                if (layer.type[grouptype] == undefined) {
                    layer.type[grouptype] = {
                        type: grouptype,
                        feed: line.e,
                        extruding: line.extruding,
                        color: color,
                        segmentCount: 0,
                        material: new THREE.LineBasicMaterial({
                            opacity: line.extruding ? 0.3 : line.g2 ? 0.2 : 0.5,
                            transparent: true,
                            linewidth: 1,
                            vertexColors: THREE.FaceColors
                        }),
                        geometry: new THREE.Geometry(),
                    }
                    if (args.indx > indxMax) {
                        layer.type[grouptype].material.opacity = 0.05;
                    }
                }
                return layer.type[grouptype];
            };

            this.drawArc = function(aX, aY, aZ, endaZ, aRadius, aStartAngle, aEndAngle, aClockwise) {
                //console.log("drawArc:", aX, aY, aZ, aRadius, aStartAngle, aEndAngle, aClockwise);
                var ac = new THREE.ArcCurve(aX, aY, aRadius, aStartAngle, aEndAngle, aClockwise);
                //console.log("ac:", ac);
                var acmat = new THREE.LineBasicMaterial({
                    color: 0x00ddff,
                    opacity: 0.5,
                    transparent: true
                });
                var acgeo = new THREE.Geometry();
                var ctr = 0;
                var z = aZ;
                ac.getPoints(20).forEach(function (v) {
                    //console.log(v);
                    z = (((endaZ - aZ) / 20) * ctr) + aZ;
                    acgeo.vertices.push(new THREE.Vector3(v.x, v.y, z));
                    ctr++;
                });
                var aco = new THREE.Line(acgeo, acmat);
                //aco.position.set(pArc.x, pArc.y, pArc.z);
                //console.log("aco:", aco);
                this.extraObjects.push(aco);
            };

            this.drawArcFrom2PtsAndCenter = function(vp1, vp2, vpArc, args) {

                //console.log("drawArcFrom2PtsAndCenter. vp1:", vp1, "vp2:", vp2, "vpArc:", vpArc, "args:", args);


                //var radius = vp1.distanceTo(vpArc);
                //console.log("radius:", radius);

                // Find angle
                var p1deltaX = vpArc.x - vp1.x;
                var p1deltaY = vpArc.y - vp1.y;
                var anglepArcp1 = Math.atan(p1deltaY / p1deltaX);

                var p2deltaX = vpArc.x - vp2.x;
                var p2deltaY = vpArc.y - vp2.y;
                var anglepArcp2 = Math.atan(p2deltaY / p2deltaX);

                // Draw arc from arc center
                var radius = vpArc.distanceTo(vp1);
                var radius2 = vpArc.distanceTo(vp2);
                //console.log("radius:", radius);

                if (Number((radius).toFixed(2)) != Number((radius2).toFixed(2))) console.log("Radiuses not equal. r1:", radius, ", r2:", radius2, " with args:", args, " rounded vals r1:", Number((radius).toFixed(2)), ", r2:", Number((radius2).toFixed(2)));

                // arccurve
                var clwise = true;
                if (args.clockwise != null && args.clockwise == false) clwise = false;
                //if (anglepArcp1 < 0) clockwise = false;
                if (p1deltaX >= 0) anglepArcp1 += Math.PI;
                if (p2deltaX >= 0) anglepArcp2 += Math.PI;
                this.drawArc(vpArc.x, vpArc.y, vp1.z, vp2.z, radius, anglepArcp1, anglepArcp2, clwise);

            };

            this.addSegment = function (p1, p2, args) {
                //console.log("");
                //console.log("addSegment p2:", p2);
                // add segment to array for later use
                lines.push({
                    p2: p2,
                    'args': args
                });

                var group = this.getLineGroup(p2, args);
                var geometry = group.geometry;

                group.segmentCount++;
                // see if we need to draw an arc
                if (p2.arc) {
                    //console.log("");
                    //console.log("drawing arc. p1:", p1, ", p2:", p2);

                    //var segmentCount = 12;
                    // figure out the 3 pts we are dealing with
                    // the start, the end, and the center of the arc circle
                    // radius is dist from p1 x/y/z to pArc x/y/z

                    var vp1 = new THREE.Vector3(p1.x, p1.y, p1.z);
                    var vp2 = new THREE.Vector3(p2.x, p2.y, p2.z);
                    var vpArc;

                    // if this is an R arc gcode command, we're given the radius, so we
                    // don't have to calculate it. however we need to determine center
                    // of arc
                    if (args.r != null) {
                        //console.log("looks like we have an arc with R specified. args:", args);
                        //console.log("anglepArcp1:", anglepArcp1, "anglepArcp2:", anglepArcp2);

                        radius = parseFloat(args.r);

                        // First, find the distance between points 1 and 2.  We'll call that q,
                        // and it's given by sqrt((x2-x1)^2 + (y2-y1)^2).
                        var q = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

                        // Second, find the point halfway between your two points.  We'll call it
                        // (x3, y3).  x3 = (x1+x2)/2  and  y3 = (y1+y2)/2.
                        var x3 = (p1.x + p2.x) / 2;
                        var y3 = (p1.y + p2.y) / 2;

                        // There will be two circle centers as a result of this, so
                        // we will have to pick the correct one. In gcode we can get
                        // a + or - val on the R to indicate which circle to pick
                        // One answer will be:
                        // x = x3 + sqrt(r^2-(q/2)^2)*(y1-y2)/q
                        // y = y3 + sqrt(r^2-(q/2)^2)*(x2-x1)/q
                        // The other will be:
                        // x = x3 - sqrt(r^2-(q/2)^2)*(y1-y2)/q
                        // y = y3 - sqrt(r^2-(q/2)^2)*(x2-x1)/q

                        if (radius >= 0) {
                            x = x3 - Math.sqrt((radius * radius) - Math.pow(q / 2, 2)) * (p1.y - p2.y) / q;
                            y = y3 - Math.sqrt((radius * radius) - Math.pow(q / 2, 2)) * (p2.x - p1.x) / q;
                        } else {
                            x = x3 + Math.sqrt((radius * radius) - Math.pow(q / 2, 2)) * (p1.y - p2.y) / q;
                            y = y3 + Math.sqrt((radius * radius) - Math.pow(q / 2, 2)) * (p2.x - p1.x) / q;
                        }

                        // now we define our circle (arc) center and just use the IJK code
                        // we painstakingly wrote already
                        var pArc = {
                            x: x,
                            y: y,
                            z: p1.z,
                        };
                        //console.log("new pArc:", pArc);
                        vpArc = new THREE.Vector3(pArc.x, pArc.y, pArc.z);
                    } else {
                        // this code deals with IJK gcode commands
                        var pArc = {
                            x: p2.arci ? p1.x + p2.arci : p1.x,
                            y: p2.arcj ? p1.y + p2.arcj : p1.y,
                            z: p2.arck ? p1.z + p2.arck : p1.z,
                        };
                        //console.log("new pArc:", pArc);
                        vpArc = new THREE.Vector3(pArc.x, pArc.y, pArc.z);
                        //console.log("vpArc:", vpArc);
                    }

                    this.drawArcFrom2PtsAndCenter(vp1, vp2, vpArc, args);

                    // still push the normal p1/p2 point for debug
                    p2.g2 = true;
                    group = this.getLineGroup(p2, args);
                    geometry = group.geometry;
                    geometry.vertices.push(
                        new THREE.Vector3(p1.x, p1.y, p1.z));
                    geometry.vertices.push(
                        new THREE.Vector3(p2.x, p2.y, p2.z));
                    geometry.colors.push(group.color);
                    geometry.colors.push(group.color);
                } else {
                    geometry.vertices.push(
                        new THREE.Vector3(p1.x, p1.y, p1.z));
                    geometry.vertices.push(
                        new THREE.Vector3(p2.x, p2.y, p2.z));
                    geometry.colors.push(group.color);
                    geometry.colors.push(group.color);
                }

                if (p2.extruding) {
                    bbbox.min.x = Math.min(bbbox.min.x, p2.x);
                    bbbox.min.y = Math.min(bbbox.min.y, p2.y);
                    bbbox.min.z = Math.min(bbbox.min.z, p2.z);
                    bbbox.max.x = Math.max(bbbox.max.x, p2.x);
                    bbbox.max.y = Math.max(bbbox.max.y, p2.y);
                    bbbox.max.z = Math.max(bbbox.max.z, p2.z);
                }
                if (p2.g0) {
                    // we're in a toolhead move, label moves
                    /*
                     if (group.segmentCount < 2) {
                     this.makeSprite(this.scene, "webgl", {
                     x: p2.x,
                     y: p2.y,
                     z: p2.z + 0,
                     text: group.segmentCount,
                     color: "#ff00ff",
                     size: 3,
                     });
                     }
                     */
                }
                // global bounding box calc
                bbbox2.min.x = Math.min(bbbox2.min.x, p2.x);
                bbbox2.min.y = Math.min(bbbox2.min.y, p2.y);
                bbbox2.min.z = Math.min(bbbox2.min.z, p2.z);
                bbbox2.max.x = Math.max(bbbox2.max.x, p2.x);
                bbbox2.max.y = Math.max(bbbox2.max.y, p2.y);
                bbbox2.max.z = Math.max(bbbox2.max.z, p2.z);
            }
            var relative = false;

            this.delta = function (v1, v2) {
                return relative ? v2 : v2 - v1;
            }

            this.absolute = function (v1, v2) {
                return relative ? v1 + v2 : v2;
            }

            this.addFakeSegment = function(args) {
                //line.args = args;
                var arg2 = {
                    isFake : true,
                    text : args.text,
                    indx : args.indx
                };
                if (arg2.text.match(/^(;|\(|<)/)) arg2.isComment = true;
                lines.push({
                    p2: lastLine,    // since this is fake, just use lastLine as xyz
                    'args': arg2
                });
            }

            var cofg = this;
            var parser = new this.GCodeParser({
                /* When doing CNC, generally G0 just moves to a new location
                 as fast as possible which means no milling or extruding is happening in G0.
                 So, let's color it uniquely to indicate it's just a toolhead move. */
                G0: function (args, indx) {
                    //G1.apply(this, args, line, 0x00ff00);
                    //console.log("G0", args);
                    var newLine = {
                        x: args.x !== undefined ? cofg.absolute(lastLine.x, args.x) : lastLine.x,
                        y: args.y !== undefined ? cofg.absolute(lastLine.y, args.y) : lastLine.y,
                        z: args.z !== undefined ? cofg.absolute(lastLine.z, args.z) : lastLine.z,
                        e: args.e !== undefined ? cofg.absolute(lastLine.e, args.e) : lastLine.e,
                        f: args.f !== undefined ? cofg.absolute(lastLine.f, args.f) : lastLine.f,
                    };
                    newLine.g0 = true;
                    //cofg.newLayer(newLine);
                    cofg.addSegment(lastLine, newLine, args);
                    lastLine = newLine;
                },
                G1: function (args, indx) {
                    // Example: G1 Z1.0 F3000
                    //          G1 X99.9948 Y80.0611 Z15.0 F1500.0 E981.64869
                    //          G1 E104.25841 F1800.0
                    // Go in a straight line from the current (X, Y) point
                    // to the point (90.6, 13.8), extruding material as the move
                    // happens from the current extruded length to a length of
                    // 22.4 mm.

                    var newLine = {
                        x: args.x !== undefined ? cofg.absolute(lastLine.x, args.x) : lastLine.x,
                        y: args.y !== undefined ? cofg.absolute(lastLine.y, args.y) : lastLine.y,
                        z: args.z !== undefined ? cofg.absolute(lastLine.z, args.z) : lastLine.z,
                        e: args.e !== undefined ? cofg.absolute(lastLine.e, args.e) : lastLine.e,
                        f: args.f !== undefined ? cofg.absolute(lastLine.f, args.f) : lastLine.f,

                    };
                    /* layer change detection is or made by watching Z, it's made by
                     watching when we extrude at a new Z position */
                    if (cofg.delta(lastLine.e, newLine.e) > 0) {
                        newLine.extruding = cofg.delta(lastLine.e, newLine.e) > 0;
                        if (layer == undefined || newLine.z != layer.z) cofg.newLayer(newLine);
                    }
                    cofg.addSegment(lastLine, newLine, args);
                    lastLine = newLine;
                },
                G2: function (args, indx, gcp) {
                    /* this is an arc move from lastLine's xy to the new xy. we'll
                     show it as a light gray line, but we'll also sub-render the
                     arc itself by figuring out the sub-segments . */
                    var newLine = {
                        x: args.x !== undefined ? cofg.absolute(lastLine.x, args.x) : lastLine.x,
                        y: args.y !== undefined ? cofg.absolute(lastLine.y, args.y) : lastLine.y,
                        z: args.z !== undefined ? cofg.absolute(lastLine.z, args.z) : lastLine.z,
                        e: args.e !== undefined ? cofg.absolute(lastLine.e, args.e) : lastLine.e,
                        f: args.f !== undefined ? cofg.absolute(lastLine.f, args.f) : lastLine.f,
                        arci: args.i ? args.i : null,
                        arcj: args.j ? args.j : null,
                        arck: args.k ? args.k : null,
                        arcr: args.r ? args.r : null,

                    };

                    //console.log("G2 newLine:", newLine);
                    //newLine.g2 = true;
                    newLine.arc = true;
                    newLine.clockwise = true;
                    if (args.clockwise) newLine.clockwise = args.clockwise;
                    cofg.addSegment(lastLine, newLine, args);
                    lastLine = newLine;
                    //console.log("G2. args:", args);
                },
                G3: function (args, indx, gcp) {
                    /* this is an arc move from lastLine's xy to the new xy. same
                     as G2 but reverse*/
                    args.arc = true;
                    args.clockwise = false;
                    gcp.handlers.G2(args, indx, gcp);
                },

                G20: function (args) {
                    // G21: Set Units to Inches
                    // We don't really have to do anything since 3d viewer is unit agnostic
                    // However, we need to set a global property so the trinket decorations
                    // like toolhead, axes, grid, and extent labels are scaled correctly
                    // later on when they are drawn after the gcode is rendered
                    console.log("SETTING UNITS TO INCHES!!!");
                    cofg.isUnitsMm = false; // false means inches cuz default is mm
                    cofg.addFakeSegment(args);

                },

                G21: function (args) {
                    // G21: Set Units to Millimeters
                    // Example: G21
                    // Units from now on are in millimeters. (This is the RepRap default.)
                    console.log("SETTING UNITS TO MM!!!");
                    cofg.isUnitsMm = true; // true means mm
                    cofg.addFakeSegment(args);

                },

                G73: function(args, indx, gcp) {
                    // peck drilling. just treat as g1
                    console.log("G73 gcp:", gcp);
                    gcp.handlers.G1(args);
                },
                G90: function (args) {
                    // G90: Set to Absolute Positioning
                    // Example: G90
                    // All coordinates from now on are absolute relative to the
                    // origin of the machine. (This is the RepRap default.)

                    relative = false;
                    cofg.addFakeSegment(args);
                },

                G91: function (args) {
                    // G91: Set to Relative Positioning
                    // Example: G91
                    // All coordinates from now on are relative to the last position.

                    // TODO!
                    relative = true;
                    cofg.addFakeSegment(args);
                },

                G92: function (args) { // E0
                    // G92: Set Position
                    // Example: G92 E0
                    // Allows programming of absolute zero point, by reseting the
                    // current position to the values specified. This would set the
                    // machine's X coordinate to 10, and the extrude coordinate to 90.
                    // No physical motion will occur.

                    // TODO: Only support E0
                    var newLine = lastLine;
                    newLine.x = args.x !== undefined ? args.x : newLine.x;
                    newLine.y = args.y !== undefined ? args.y : newLine.y;
                    newLine.z = args.z !== undefined ? args.z : newLine.z;
                    newLine.e = args.e !== undefined ? args.e : newLine.e;
                    lastLine = newLine;
                    cofg.addFakeSegment(args);
                },
                M30: function (args) {
                    cofg.addFakeSegment(args);
                },
                M82: function (args) {
                    // M82: Set E codes absolute (default)
                    // Descriped in Sprintrun source code.

                    // No-op, so long as M83 is not supported.
                    cofg.addFakeSegment(args);
                },

                M84: function (args) {
                    // M84: Stop idle hold
                    // Example: M84
                    // Stop the idle hold on all axis and extruder. In some cases the
                    // idle hold causes annoying noises, which can be stopped by
                    // disabling the hold. Be aware that by disabling idle hold during
                    // printing, you will get quality issues. This is recommended only
                    // in between or after printjobs.

                    // No-op
                    cofg.addFakeSegment(args);
                },

                'default': function (args, info) {
                    //if (!args.isComment)
                    //    console.log('Unknown command:', args.cmd, args, info);
                    cofg.addFakeSegment(args);
                },
            });

            parser.parse(gcode);

            console.log("inside creatGcodeFromObject. this:", this);

            console.log("Layer Count ", layers.length);


            var object = new THREE.Object3D();

            for (var lid in layers) {
                var layer = layers[lid];
                //		console.log("Layer ", layer.layer);
                for (var tid in layer.type) {
                    var type = layer.type[tid];
                    //			console.log("Layer ", layer.layer, " type ", type.type, " seg ", type.segmentCount);
                    object.add(new THREE.Line(type.geometry, type.material, THREE.LinePieces));
                }
            }
            //console.log("extraOjbects", this.extraObjects);
            this.extraObjects.forEach(function(obj) {
                object.add(obj);
            });

            console.log("bbox ", bbbox);

            // Center
            var scale = 1; // TODO: Auto size

            var center = new THREE.Vector3(
                    bbbox.min.x + ((bbbox.max.x - bbbox.min.x) / 2),
                    bbbox.min.y + ((bbbox.max.y - bbbox.min.y) / 2),
                    bbbox.min.z + ((bbbox.max.z - bbbox.min.z) / 2));
            console.log("center ", center);

            var center2 = new THREE.Vector3(
                    bbbox2.min.x + ((bbbox2.max.x - bbbox2.min.x) / 2),
                    bbbox2.min.y + ((bbbox2.max.y - bbbox2.min.y) / 2),
                    bbbox2.min.z + ((bbbox2.max.z - bbbox2.min.z) / 2));
            console.log("center2 of all gcode ", center2);

            // store meta data in userData of object3d for later use like in animation
            // of toolhead
            object.userData.bbbox2 = bbbox2;
            object.userData.lines = lines;
            object.userData.layers = layers;
            object.userData.center2 = center2;
            object.userData.extraObjects = this.extraObjects;

            console.log("userData for this object3d:", object.userData);
            /*
             this.camera.target.x = center2.x;
             this.camera.target.y = center2.y;
             this.camera.target.z = center2.z;
             */

            //object.position = center.multiplyScalar(-scale);

            //object.scale.multiplyScalar(scale);
            console.log("final object:", object);

            return object;
        }
    }
});
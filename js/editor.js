/**
 * --comments Copyright 2016, Deepak Ghimire.  All rights reserved.
 */
"use strict";
var undef = void 0;
(function (MOCKUP) {

    var Panel = (function () {
        function Panel(title) {
            var domElement = this.domElement = document.createElement('div');
            domElement.className = 'panel';
            domElement.textContent = title;
        }

        Panel.prototype.bind = function (eventName, callback) {
            var domElement = this.domElement;
            domElement.on(eventName, callback);
            return this;
        };
        Panel.prototype.add = function () {

            for (var panelCount = 0; panelCount < arguments.length; panelCount++) {
                var panel = arguments[panelCount];
                if (panel !== undef) {
                    if (panel instanceof Panel && panel.domElement !== undef) {
                        this.domElement.appendChild(panel.domElement);
                        //$(panel.domElement).addClass("submenu");
                    } else {
                        console.error('Panel:', panel, ' is not a valid panel.')
                    }
                }
            }

            return this;
        };
        return Panel;
    })({});

    var Menu = (function (_super) {
        __extends(Menu, _super);
        function Menu(title, parent, shortcut) {
            _super.call(this, title);

            $(this.domElement).addClass('menu');
            this.domElement.textContent = "";
            this.title = title;
            if (shortcut !== undef) {
                var shortcutDom = document.createElement('span');
                shortcutDom.className = 'shortcut';
                shortcutDom.textContent = shortcut;
                this.domElement.appendChild(shortcutDom);
            }

            var titleDom = document.createElement('span');
            titleDom.className = 'title';
            titleDom.textContent = title;
            this.domElement.appendChild(titleDom);

            if (parent !== undef) parent.add(this);
            this._disabled = 0;
            return this;
        }

        function checkSubDom(menu) {
            if (menu.subDom == undef) {
                menu.subDom = document.createElement('div');
                menu.subDom.className = 'submenus';
                menu.domElement.appendChild(menu.subDom);
                $(menu.domElement).addClass("hasChild");
            }
        }

        Menu.prototype.add = function () {
            checkSubDom(this);
            for (var menuCount = 0; menuCount < arguments.length; menuCount++) {
                var subMenu = arguments[menuCount];
                if (subMenu !== undef) {
                    if (subMenu instanceof Menu && subMenu.domElement !== undef) {
                        this.subDom.appendChild(subMenu.domElement);
                        $(subMenu.domElement).addClass("submenu");
                        $(subMenu.domElement).removeClass("menu");
                    } else {
                        console.error('Menu:', subMenu, ' is not a valid menu.')
                    }
                }
            }

            return this;
        };
        Menu.prototype.addSeparator = function () {
            checkSubDom(this);
            this.subDom.appendChild(document.createElement('hr'));
        };
        Menu.prototype.disabled = function (disabled) {
            if (disabled === undef) {//get value
                return this._disabled;
            }
            else {//set value
                this._disabled = disabled;
                if (this._disabled) $(this.domElement).addClass("disabled");
                else $(this.domElement).removeClass("disabled");
            }
        };
        Menu.prototype.value = function (value) {
            $(this.domElement).find("> .menu-value").remove();
            if (value !== undef && value.trim() !== "")
                $(this.domElement).append('<span class="menu-value">' + value + '</span>');
        }
        return Menu;
    })(Panel);

    var User = (function () {
        var User = function () {
            var user = this;
            //user.editor = editor;
        };
        User.prototype.signIn = function (interactive) {
            var user = this;
            return new Promise(function (resolve, reject) {
                chrome.identity.getAuthToken({'interactive': interactive}, function (token) {
                    parseGoogleCallback(token).then(
                        function (token) {
                            user.setToken(token);
                            resolve();
                        }, function (error) {
                            reject(error);
                        })
                });
            });
        };

        function parseGoogleCallback(response) {
            return new Promise(function (resolve, reject) {
                if (chrome.runtime.lastError) {
                    reject(response);
                } else {
                    resolve(response);
                }
            });
        };

        User.prototype.setToken = function (token) {

            this.token = token;
            if (window.gapi && window.gapi.auth)
                gapi.auth.setToken({
                    access_token: token
                });

        }

        User.prototype.signOut = function () {
            var user = this;
            return new Promise(function (resolve, reject) {
                chrome.identity.removeCachedAuthToken({token: editor.user.token}, function () {
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', 'https://accounts.google.com/o/oauth2/revoke?token=' +
                    editor.user.token);
                    xhr.send();
                    user.setToken();
                    resolve();
                })
            });
        };

        User.prototype.getAuthTokenSilent = function (callback) {
            getAuthToken({
                'interactive': false,
                'callback': getAuthTokenSilentCallback,
            });
        };

        User.prototype.getProfile = function () {
            var user = this;
            return new Promise(function (resolve, reject) {
                gapi.client.request({
                    path: "/plus/v1/people/me",
                    method: 'GET',
                    headers: {'Authorization': 'Bearer ' + user.token}
                }).then(function (profile) {
                    editor.user.name = profile.result.displayName;
                    editor.user.imageUrl = profile.result.image.url;
                    resolve(profile);
                });
            });

        }

        function pickerCallback(data) {
            //var url = 'nothing';

            if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
                var doc = data[google.picker.Response.DOCUMENTS][0];
                var docData = {
                    id: doc[google.picker.Document.ID],
                    name: doc[google.picker.Document.NAME]
                };
                if (doc.type == "folder") {
                    //url = doc[google.picker.Document.URL];
                    editor.user.folder = docData;
                    chrome.storage.sync.set({'googleDriveFolder': editor.user.folder});
                    updateDriveLocation();
                }
                else if (doc.type == "file") {
                    if (doc.mimeType.indexOf("json") > -1) {

                        var request = gapi.client.request({
                            path: "/drive/v2/files/" + docData.id + "?alt=media",
                            method: 'GET',
                            headers: {'Authorization': 'Bearer ' + editor.user.token}
                        }).then(function (response) {
                            var data = response.result;

                            function processFile() {
                                swal.close();
                                editor.reset();
                                editor.user.file = docData;
                                editor.currentFileName = docData.name;
                                editor.updateTitle();
                                editor.fromJSON(data);
                            }

                            if (data.stage == void 0) {
                                data = JSON.parse(data);
                            }
                            if (data.stage == void 0) {
                                swal({
                                    title: "Invalid File...",
                                    text: "The selected file ('" + docData.name + "') is invalid or currupted.",
                                    confirmButtonColor: editor.colors.red,
                                    confirmButtonText: "Use File Anyway!",
                                    closeOnConfirm: true

                                }, function (isConfirm) {
                                    if (isConfirm) {
                                        processFile();
                                    }
                                });
                            } else {
                                processFile();
                            }
                        }, function (reason) {
                            swal.close();
                            console.log("Could not load file:" + reason);
                        });
                        swal({
                            title: "Loading data...",
                            text: "Loading : " + docData.name,
                            showConfirmButton: false
                        });
                    }
                    //load the json file.
                }
            }
            //var message = 'You picked: ' + url;
            //console.log(message);
        }

        function get(options) {
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    // JSON response assumed. Other APIs may have different responses.
                    if (xhr.status === 200) {
                        options.callback(JSON.parse(xhr.responseText));
                    }
                    else {

                        console.log('get', xhr.readyState, xhr.status, xhr.responseText);
                    }
                } else {
                    //console.log('get', xhr.readyState, xhr.status, xhr.responseText);

                }
            };
            xhr.open("GET", options.url, true);
            // Set standard Google APIs authentication header.
            xhr.setRequestHeader('Authorization', 'Bearer ' + options.token);
            xhr.send();
        }

        function getProfile(token) {
            get({
                'url': 'https://www.googleapis.com/plus/v1/people/me',
                'callback': getProfileCallback,
                'token': token,
            });
            if (window.gapi && window.gapi.auth)
                gapi.auth.setToken({
                    access_token: token
                });
            chrome.storage.sync.get('googleDriveFolder', function (result) {
                if (result !== undef) {
                    editor.user.folder = result.googleDriveFolder;
                    updateDriveLocation();
                }
            });
            showLogin(false);
            editor.user.token = token;
        }

        function updateDriveLocation() {
            setDirectory.value("Current Location: " + editor.user.folder.name);
            loadGoogleDriveMenu.value("Current Location: " + editor.user.folder.name);
        }

        function getProfileCallback(person) {
            editor.user.name = person.displayName;
            editor.user.imageUrl = person.image.url;

            logOutMenu.value(editor.user.name);
            userMenu.value("Logged in as: " + editor.user.name);
            $(menuBar.domElement).find(".login-profile-icon").remove();
            $(menuBar.domElement).prepend('<img class="login-profile-icon" src="' + editor.user.imageUrl + '" title="Logged in as: ' + editor.user.name + '">')
            //showProfileNotification(options);
        }

        function getAuthToken(options) {
            chrome.identity.getAuthToken({'interactive': options.interactive}, options.callback);
        }

        function getAuthTokenSilent() {
            getAuthToken({
                'interactive': false,
                'callback': getAuthTokenSilentCallback,
            });
        }

        function getAuthTokenSilentCallback(token) {
            // Catch chrome error if user is not authorized.
            if (chrome.runtime.lastError) {
                showLogin(true);
                console.log("User not authorized");
            } else {
                getProfile(token);
            }
        }

        function getAuthTokenInteractive() {
            getAuthToken({
                'interactive': true,
                'callback': getAuthTokenInteractiveCallback,
            });
        }

        function getAuthTokenInteractiveCallback(token) {
            // Catch chrome error if user is not authorized.
            if (chrome.runtime.lastError) {
                showLogin(true);
                console.log("User not authorized");
            } else {
                getProfile(token);
            }
        }

        return User;
    })({});

    MOCKUP.Editor = (function () {
        function Editor(canvas, presets) {

            var editor = this;

            (function initDefaults(editor) {
                editor.defaultObject = undef;
                editor.colors = {
                    blue: "#2fa1d6",
                    gray: "#888",
                    blueActive: "#2B8CB8",
                    red: "#DD6B55",
                    green: "#63af5b"
                };
                editor.testWidth = 1920;
                editor.imageSizes = {
                    "Default": {width: 3000, height: 2000},
                    "Default ScaleDown": {width: 1500, height: 1000},
                    "Full HD": {width: 1920, height: 1080},
                    "HD": {width: 1280, height: 720},
                    "Dribble @2x": {width: 800, height: 600}
                };
                editor.imageQuality = 0.99;
                editor.thumbnailQuality = 0.98;
                editor.skipPropertyUpdate = false;
                editor.untitledFileName = "*Untitled";
                editor.currentFileName = editor.getNewFileName();
                editor.mouse = new THREE.Vector2();
                editor.raycaster = new THREE.Raycaster();
                editor.mouseMoved = false;
                editor.type = "Editor";
                editor.downloadWidth = 3000;
                editor.downloadHeight = 2000;
                editor.selectedFile = null;
                editor.user = new User();
            })(editor);

            (function initStage(editor) {
                var stage = editor.stage = new MOCKUP.Stage({canvas: canvas});
                stage.showShadowMap = false;
                stage.selectiveRendering = true;
                editor.container = stage.canvas.parent();

                //Camera
                var camera = editor.camera = stage.camera;
                camera.position.z = 500;
                camera.defaultPosition = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z);

                var renderer = editor.renderer = stage.renderer;

                var orbitControl = editor.orbitControl = stage.orbitControl;// new THREE.OrbitControls(camera, renderer.domElement);
                //orbitControl.maxPolarAngle = Math.PI;

                //Transform controls
                var transformControls = editor.transformControls = new THREE.TransformControls(camera, renderer.domElement);
                transformControls.orbitControl = orbitControl;
                transformControls.addEventListener('change', function () {
                    //orbitControl.enabled=false;
                    //if(editor.previewMode!==true) {
                    editor.selectionBox.update(transformControls.object);
                    editor.stage.render();
                    //}
                });
                stage.add(transformControls);

                orbitControl.addEventListener('change', function () {
                    editor.transformControls.update();
                });

                var selectionBox = editor.selectionBox = new THREE.BoxHelper();
                selectionBox.material.depthTest = false;
                selectionBox.material.transparent = true;
                selectionBox.visible = false;
                stage.add(selectionBox);

                var cloneSelection = editor.cloneSelection = new MOCKUP.CloneBoxHelper(stage);

                if (MOCKUP.mode !== MOCKUP.MODE.PLUGIN) {
                    camera.position.y = 450;
                    camera.position.z = 150;
                    orbitControl.maxPolarAngle = Math.PI / 2;
                }

                orbitControl.update();
                editor.resize();

                //just for debugging shadow map
                if (stage.showShadowMap) {
                    var dirLightShadowMapViewer = this.dirLightShadowMapViewer = new THREE.ShadowMapViewer(stage.spotLight);
                    dirLightShadowMapViewer.position.x = 10;
                    dirLightShadowMapViewer.position.y = 400;
                    dirLightShadowMapViewer.size.width = 256;
                    dirLightShadowMapViewer.size.height = 256;
                    dirLightShadowMapViewer.update();
                }
            })(editor);

            (function initUI(editor) {
                (function windowTriggers(editor) {
                    if (deip.isApp) {
                        chrome.runtime.onSuspend.addListener(function (e) {
                            return editor.beforeUnload(e);
                        });
                        chrome.app.window.onClosed.addListener(function (e) {
                            chrome.storage.local.set({'autosave': editor.toJSON()});
                        });
                    }
                    else {
                        window.addEventListener('beforeunload', function (e) {
                            return editor.beforeUnload(e);
                        }, false);
                    }

                    window.addEventListener('resize', function () {
                        editor.resize();
                    }, false);
                })(editor);

                (function htmlUIButtons(editor) {
                    var container = editor.container;
                    $("body").addClass(deip.isApp ? "app" : "browser");
                    //Download button
                    var downloadButton = $("<div class='webgl-download' title='Generate mockup image'>Generate Mockup<span class='image-size current'>" + editor.downloadWidth + "px X " + editor.downloadHeight + "px</span></div>");
                    downloadButton.on("click", (function () {
                        editor.download();
                    }));

                    downloadButton.append().append($("<div id='image_sizes'>. . .<ul class='image-size-list'></ul></div>"));
                    container.append(downloadButton);
                    editor.updateImageSize = function (parameters) {
                        editor.downloadWidth = parameters.width;
                        editor.downloadHeight = parameters.height;
                        $(".image-size.current").text(parameters.width + "px X " + parameters.height + "px");
                        if (parameters.updateDB !== false) {
                            editor.db.config.put({
                                key: "imageSize", value: {width: parameters.width, height: parameters.height}
                            }).then(function () {

                            }).catch(function (err) {
                                console.log("Could not update imageSize to database:" + err.message);
                            }).finally(function () {
                                // Do what should be done next...
                            });
                        }
                    };

                    var imageSizeListContainer = $(".image-size-list");
                    var imageSizes = editor.imageSizes;
                    for (var key in imageSizes) {
                        var size = imageSizes[key];
                        var sizeText = size.width + 'px X ' + size.height + 'px';
                        var list = $('<li class="image-size-item">' + key + '<span class="image-size">' + sizeText + '</span></li>');
                        list.data("width", size.width).data("height", size.height);
                        imageSizeListContainer.append(list);
                        list.on("click", function (e) {
                            var list = $(this);
                            editor.updateImageSize({width: list.data("width"), height: list.data("height")});
                        });
                    }


                    container.append($("<div class='webgl-preview'></div>"));

                    //translate and rotate
                    var transformHolder = $("<div class='transform-controls-container'></div>");
                    transformHolder.append($("<div class='controls-move transform-controls active'>Move</div>").on("click", (function () {
                        editor.transformControls.setMode('translate');
                        MOCKUP.Editor.activate(".transform-controls", this);
                    })));
                    transformHolder.append($("<div class='controls-rotate transform-controls'>Rotate</div>").on("click", (function () {
                        editor.transformControls.setMode('rotate');
                        MOCKUP.Editor.activate(".transform-controls", this);
                    })));
                    container.append(transformHolder);

                    $("#purchase_link").attr('href', MOCKUP.purchaselink);
                })(editor);


                (function enableExplorer(editor) {
                    if (deip.isApp) {
                        if (editor.addAppExplorer) editor.addAppExplorer();
                    }
                    else {
                        if (editor.addExtensionExplorer) editor.addExtensionExplorer();
                    }
                })(editor);

                initMenu(editor);

                initTitleBar(editor);

                initQuickStart(editor);

                //controls
                (function initControls(editor) {
                    editor.gui = new dat.GUI();
                    editor.globalProperties = undef;
                    editor.objectProperties = undef;
                    editor.controls = undef;

                    initializeControls(editor);

                    addGlobalControls(editor);

                    addObjectControls(editor);
                    addTips(editor);
                })(editor);

                editor.resize();

                if (presets !== undef) {
                    editor.presets = presets;
                    MOCKUP.LoadTypes(editor);
                }
                editor.updateMenuPresets(editor.selected);
                editor.changeMode(1);
            })(editor);

            (function initInput(editor) {


                window.addEventListener('mousemove', function (event) {
                    editor.stage.renderRequestPending = true;
                }, false);
                editor.renderer.domElement.addEventListener('mousewheel', function (event) {
                    editor.stage.renderRequestPending = true;
                }, false);
                window.addEventListener('keyup', function (event) {
                    editor.stage.renderRequestPending = true;
                }, false);

                (function initKeyBoard(editor) {
                    var ctrlDown = false, shiftDown = false, altDown = false;
                    var shiftKey = 16, ctrlKey = 17, altKey = 18, sKey = 83, vKey = 86, cKey = 67, eKey = 69, gKey = 71, nKey = 78, oKey = 79, deleteKey = 46;

                    var keyDom = editor.container.parent()[0];
                    document.addEventListener('keydown', onKeyDown, false);
                    document.addEventListener('keyup', onKeyUp, false);

                    function onKeyDown(event) {
                        if (event.srcElement.nodeName.toUpperCase() !== "BODY") return;
                        //console.log(event.keyCode);
                        switch (event.keyCode) {
                            case shiftKey:
                                shiftDown = true;
                                break;
                            case ctrlKey:
                                ctrlDown = true;
                                break;
                            case altKey:
                                altDown = true;
                                break;
                            case sKey:
                                if (ctrlDown) {
                                    //if (shiftDown)
                                    //    editor.menubar.fileMenu.saveAsMenu.domElement.click();
                                    //else
                                    editor.menubar.fileMenu.saveToFileMenu.domElement.click();
                                    event.preventDefault();
                                }
                                break;
                            case gKey:
                                if (ctrlDown) {
                                    if (shiftDown) {
                                        editor.menubar.fileMenu.googleDriveFolder.domElement.click();
                                        event.preventDefault();
                                    }
                                }
                                break;
                            case nKey:
                                if (ctrlDown) {
                                    editor.menubar.fileMenu.newMenu.domElement.click();
                                    event.preventDefault();
                                }
                                break;
                            case oKey:
                                if (ctrlDown) {
                                    if (shiftDown)
                                        editor.menubar.fileMenu.loadServerMenu.domElement.click();
                                    else
                                        editor.menubar.fileMenu.loadFileMenu.domElement.click();
                                    event.preventDefault();
                                }
                                break;
                            case eKey:
                                if (ctrlDown) {
                                    editor.menubar.fileMenu.loadExamplesMenu.domElement.click();
                                    event.preventDefault();
                                }
                                break;
                            case vKey:
                                if (ctrlDown)
                                    editor.menubar.addMenu.addCopy.domElement.click();
                                break;
                            case cKey:
                                if (ctrlDown)
                                    editor.menubar.addMenu.addClone.domElement.click();
                                break;
                            case deleteKey:
                                editor.menubar.addMenu.removeObject.domElement.click();
                                break;
                            default:
                                break;

                        }

                    }

                    function onKeyUp(event) {
                        switch (event.keyCode) {
                            case shiftKey:
                                shiftDown = false;
                                break;
                            case ctrlKey:
                                ctrlDown = false;
                                break;
                            case altKey:
                                altDown = false;
                                break;
                            default:
                                break;
                        }

                    }
                })(editor);

                (function initMouse(editor) {

                    var container = editor.container;
                    if (MOCKUP.mode !== MOCKUP.MODE.PLUGIN) {

                        editor.renderer.domElement.addEventListener('click', editor_click, false);
                        editor.renderer.domElement.addEventListener('dblclick', editor_dblclick, false);
                        editor.renderer.domElement.addEventListener('mousemove', editor_mouseMove, false);
                        editor.renderer.domElement.addEventListener('mousedown', editor_mouseDown, false);

                    }
                    function editor_mouseMove(event) {
                        if (editor.isMouseDown && event.movementX != 0 && event.movementY != 0) {
                            editor.isMouseMoving = true;
                        }
                    }

                    function editor_mouseDown(event) {
                        document.activeElement.blur();
                        editor.mouseValue = event.pageX + "," + event.pageY;
                        editor.isMouseMoving = false;
                        editor.isMouseDown = true;
                    }

                    function editor_click(event) {
                        editor.isMouseDown = false;
                        var mouseValue = event.pageX + "," + event.pageY;

                        if (editor.isMouseMoving) {

                        }
                        else if (mouseValue == editor.mouseValue) {
                            event = event || window.event;
                            event = $.event.fix(event);

                            var mouse = editor.mouse, raycaster = editor.raycaster;
                            mouse.x = ( (event.pageX - editor.stage.canvas.position().left) / editor.stage.canvas.innerWidth() ) * 2 - 1;
                            mouse.y = -( (event.pageY - editor.stage.canvas.position().top) / editor.stage.canvas.innerHeight() ) * 2 + 1;

                            raycaster.setFromCamera(mouse, editor.stage.camera);

                            var intersects = raycaster.intersectObjects(editor.stage.children, true);

                            if (intersects.length > 0) {

                                var object, objectCount = 0;
                                do {
                                    object = intersects[objectCount].object;
                                    editor.clickFace = intersects[objectCount].face;
                                    objectCount++;
									if(object.mockupParent !== void 0) break;
                                } while (object instanceof THREE.BoxHelper || !(object instanceof MOCKUP.Paper))

                                if (object.parent instanceof  MOCKUP.Bundle) {
                                    object = object.parent;
                                }

								if(object.mockupParent !==void 0){
									object = object.mockupParent;
								}

                                if (object.userData && object.userData.object !== undef) {

                                    // helper

                                    editor.selectObject(object.userData.object);

                                } else {

                                    editor.selectObject(object);

                                }

                            } else {

                                editor.selectObject(null);

                            }
                        }
                        editor.stage.render();
                    }

                    function editor_dblclick(event) {
                        //editor_click(event);
                        var object = editor.selected;
                        var face = editor.clickFace;
                        if (object.geometryType == MOCKUP.GEOMETRY_TYPE.BOX) {
                            if (face.materialIndex == 5) {
                                editor.objectProperties.backImage.hiddenFileInput.click();
                            }
                            else {
                                editor.objectProperties.frontImage.hiddenFileInput.click();
                            }
                            //console.log(object.material.materials[face.materialIndex].map.sourceFile);
                        }
                        else {
                            editor.objectProperties.frontImage.hiddenFileInput.click();
                            //console.log(object.material.map.sourceFile);
                        }
                        deip.sendEvent("Double Click", deip.actionType, object.type);
                    }

                })(editor);

            })(editor);

            (function initDB(editor) {
                var db = editor.db = new Dexie('MockupStudio');

                // Define a schema
                db.version(1)
                    .stores({
                        mockups: 'id, name, user, timestamp, image, data,username,type',//type are fav, recent, local,
                        autosave: 'id, data,timestamp',
                        config: 'key,value'
                    });


                // Open the database
                db.open()
                    .catch(function (error) {
                        console.log('Error opening database: ' + error);
                    });

                editor.reset(false);
                if (deip.isApp) {
                    initAutoSave(editor);
                }
                else {
                    // Populate from AJAX:
                    db.on('ready', function () {
                        // on('ready') event will fire when database is open but before any
                        // other queued operations start executing.
                        // By returning a Promise from this event,
                        // the framework will wait until promise completes before
                        // resuming any queued database operations.
                        // Let's start by counting the number of objects in our table.
                        db.autosave.count(function (count) {
                            if (count > 0) {
                                db.autosave.get("0", function (item) {
                                    if(item!==undef) {
                                        /*                                    swal({
                                         title: "Restore last session!",
                                         text: "A last session data was detected. want to restore it?",
                                         type: "info",
                                         showCancelButton: true,
                                         confirmButtonColor: editor.colors.green,
                                         confirmButtonText: "Restore",
                                         closeOnConfirm: true
                                         }, function (isConfirm) {
                                         if (isConfirm) {
                                         editor.reset();
                                         editor.fromJSON(item.data);
                                         editor.updateTitle();
                                         }
                                         editor.quickstart.check();
                                         });*/

                                        editor.reset();
                                        editor.fromJSON(item.data);
                                        editor.updateTitle();
                                    }
                                    editor.quickstart.check();
                                }).then(function () {
                                    console.log("restored");
                                }).catch(function (err) {
                                    console.error("Could not restore mockup from database: " + err.message);
                                }).finally(function () {
                                    if (deip.isExtension)
                                        editor.explorer.init();
                                });
                            } else {
                                editor.quickstart.check();
                            }
                        });

                        //restore imageSize settings
                        db.config.get("imageSize", function (item) {
                            if(item!==undef) {
                                var size = item.value;
                                if (size.width == undef) {
                                    size.width = 3000;
                                    size.height = 2000;
                                }
                                else
                                    size.updateDB = false;
                                editor.updateImageSize(size);
                                console.log(size);
                            }
                        }).then(function () {
                        }).catch(function (err) {
                            console.error("Could not restore imageSize from database: " + err.message);
                        }).finally(function () {
                        });
                    });
                }

                MOCKUP.autoSave = function () {
                    editor.autosave();
                    editor.stage.renderRequestPending = true;
                };
            })(editor);

            /*
             var gDriveConfig = {
             client_id: "661814662202-cgn3p7lodc5b076rvsj0i57ssens9s24.apps.googleusercontent.com",
             client_secret: "0tL3OG9PhS_I7Zqp_8uH5qPl",
             api_scope: "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email"
             };
             var googleAuth = _this.googleAuth = new OAuth2("google", gDriveConfig);
             */

            //chrome.identity.getAuthToken();
        }

        function initAutoSave(editor) {
            if (deip.isApp) {
                chrome.storage.local.get('autosave', function (result) {
                    console.log("restored");//console.log("restored",result.autosave);

                    if (result !== undef && result.autosave !== undef) {
                        swal({
                            title: "Restore last session!",
                            text: "A last session data was detected. want to restore it?",
                            type: "info",
                            showCancelButton: true,
                            confirmButtonColor: editor.colors.green,
                            confirmButtonText: "Restore",
                            closeOnConfirm: true
                        }, function (isConfirm) {
                            if (isConfirm) {
                                editor.fromJSON(result.autosave);
                            }
                            editor.quickstart.check();
                        });
                    }
                    else
                        editor.quickstart.check();
                });
            }
            else {
                var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

                if (indexedDB === undefined) {
                    console.warn('AutoSave: IndexedDB not available.');
                }

                var name = 'mockup';
                var version = 1;

                var database;

                var request = indexedDB.open(name, version);
                request.onupgradeneeded = function (event) {
                    var db = event.target.result;
                    if (db.objectStoreNames.contains('autosave') === false) {
                        db.createObjectStore('autosave');
                    }
                };

                request.onsuccess = function (event) {
                    database = event.target.result;
                    if (database !== undefined) {
                        var transaction = database.transaction(['autosave'], 'readwrite');
                        var objectStore = transaction.objectStore('autosave');
                        var request = objectStore.get(0);
                        request.onsuccess = function (event) {
                            if (event.target.result !== undef) {
                                swal({
                                    title: "Restore last session!",
                                    text: "A last session data was detected. want to restore it?",
                                    type: "info",
                                    showCancelButton: true,
                                    confirmButtonColor: editor.colors.green,
                                    confirmButtonText: "Restore",
                                    closeOnConfirm: true
                                }, function (isConfirm) {
                                    if (isConfirm) {
                                        editor.fromJSON(event.target.result);
                                    }
                                    editor.quickstart.check();
                                });
                            }
                            else
                                editor.quickstart.check();
                        };
                    }
                    editor.database = database;
                };

                request.onerror = function (event) {
                    console.error('Mockup: AutoSave IndexedDB', event);
                };
            }

        }

        function initTitleBar(editor) {
            var titleBar = editor.titleBar = $("<div class='title-bar'></div>");

            var minimize, restore, maximize, title, close, icon;

            minimize = $("<div class='title-options app-minimize' title='Minimize'></div>");
            restore = $("<div class='title-options app-restore' title='Restore Down'></div>");
            maximize = $("<div class='title-options app-maximize' title='Maximize'></div>");
            close = $("<div class='title-options app-close' title='Close'></div>");
            title = $("<div class= 'app-title'></div>");
            icon = $("<div class='app-icon'></div>");

            editor.container.parent().append(titleBar);
            titleBar.append(icon);
            titleBar.append(title);
            titleBar.append(close);
            titleBar.append(restore);
            titleBar.append(maximize);
            titleBar.append(minimize);

            titleBar.updateTitle = function (titleName) {
                title.html(titleName);
            };

            minimize.on("click", function () {
                chrome.app.window.current().minimize();
            });

            maximize.on("click", function () {
                maximize.hide();
                restore.show();
                chrome.app.window.current().maximize();
            });

            restore.on("click", function () {
                maximize.show();
                restore.hide();
                chrome.app.window.current().restore();
            });

            if (deip.isApp) {
                chrome.app.window.onBoundsChanged.addListener(function (e) {
                    if (chrome.app.window.current().isMaximized()) {
                        maximize.show();
                        restore.hide();
                    }
                    else {
                        maximize.hide();
                        restore.show();
                    }
                });
            }

            close.on("click", function () {
                editor.autosave(true);
                window.close();
            });

            window.onfocus = function () {
                //console.log("focus");
                $("body").removeClass("lostfocus");
            };

            window.onblur = function () {
                //console.log("blur");
                $("body").addClass("lostfocus");
            };

        }

        function initQuickStart(editor) {

            var quickstart = editor.quickstart = $("<div class='explorer quick-start'></div>");
            var search, breadcrumbs, fileList, header, close;

            header = $("<div class='explorer-title'><div>Your Mockup scene looks empty?..</div><div>Select an example mockup from below to start with..</div></div>");
            close = $("<div class='explorer-close'>Cancel</div>");
            fileList = $('<ul class= "data"></ul>');

            var getMore = $('<a class="get-more" target="_blank" href="' + MOCKUP.purchaselink + '">You can use and share unlimited free mockups with full version. GET NOW!!</a>');

            editor.container.append(quickstart);
            quickstart.append(header);
            quickstart.append(fileList);
            quickstart.append(close);
            if (editor.explorer == undef)
                quickstart.append(getMore);


            var quickStartValues = MOCKUP.quickStart;
            editor.createFileList(quickStartValues, fileList, function (event, element) {
                element = $(element);
                event.preventDefault();
                var dataFile = element.find('a.files').attr('href');
                editor.loadFile(dataFile);
                deip.sendEvent("QuickStart", deip.actionType, dataFile);
                quickstart.hide();
            });


            close.on("click", function () {
                quickstart.hide();
            });

            quickstart.check = function () {
                var hasChild = false;
                if (deip.isFull) {
                    hasChild = editor.stage.hasChild();
                }
                if (hasChild == false)
                    editor.quickstart.fadeIn();
            }

        }

        function initMenu(editor) {
            var menuBar = editor.menubar = new Panel();
            var container = editor.container;
            var $menu = $(menuBar.domElement);
            container.append($menu);
            $menu.addClass("menubar");

            var isFull = deip.isFull = (editor.explorer !== undef);

            var isFullText = (isFull ? "" : " - Buy Now");
            deip.actionType = (deip.isApp ? "App-" : (deip.isExtension ? "Ext-" : "Web-")) + (isFull ? "Normal" : "Buy");
            $(menuBar.domElement).on("click", function (event) {
                var target = $(event.target);
                target = target.closest("div.panel");
                var ev = $._data(target[0], 'events');
                if (!target.hasClass("disabled") && (ev && ev.click)) {
                    //if (target.is("span.title")) {
                    //    deip.sendEvent("Menu", deip.actionType, target.text());
                    //}
                    //else if (target.is("div.panel.menu")) {
                    deip.sendEvent("Menu", deip.actionType, $(target.find(".title")[0]).text());
                    //}
                }
            });
            //User Menu
            //loadUserMenu(editor, menuBar);
            loadFileMenu(editor, menuBar);
            loadAddMenu(editor, menuBar);
            loadHelpMenu(editor, menuBar);


            var loadExamplesMenu = menuBar.loadExamplesMenu = new Menu("Mockup Examples", menuBar);
            $(loadExamplesMenu.domElement).on("click", function (event) {
                editor.menubar.fileMenu.loadExamplesMenu.domElement.click();

            });
            /*        if(editor.explorer==undef) {
             var buyMenu = menuBar.buyMenu = new Menu("Get Full Version", menuBar);
             $(buyMenu.domElement).on("click", function (event) {
             window.open(MOCKUP.purchaselink, '_blank');
             });
             }*/
            if (!deip.isApp && !deip.isExtension) {
                var extensionMenu = menuBar.extensionMenu = new Menu("Get Chrome Addon", menuBar);
                $(extensionMenu.domElement).on("click", function (event) {
                    window.open(MOCKUP.extensionlink, '_blank');
                });
            }

            var changeMode = menuBar.changeMode = new Menu("", menuBar);
            $(changeMode.domElement).on("click", function (event) {
                editor.changeMode(!editor.previewMode);
            }).addClass("editor-mode");

            loadSocialLinks(editor, menuBar);


        }

        function loadSocialLinks(editor, menuBar) {
            var $menu = $(menuBar.domElement);
            var $social = $('<div class="social"></div>');
            //var facebookLink = $('<a class="social-link facebook-link" href="https://www.facebook.com/MockupStudioApp/" target="_blank"></a>');
            var googleLink = $('<a class="social-link google-link" href="https://plus.google.com/b/102690169013229059021/102690169013229059021" target="_blank"></a>');
            var origin = escape(window.location.origin);

            //$menu.append($social);
            //$social.append(facebookLink);
            $social = $(".quick-hint").html('<div class="social-title">Made by <a href="https://www.facebook.com/deipgroup/" target="_blank">DeipGroup</a>. Follow for updates:</div>');

            //if (!deip.isExtension && !deip.isApp) {
            //    var fbRoot = $('<div id="fb-root"></div>');
            //    var fbLike = $('<div class="fb-like" data-href="https://www.facebook.com/MockupStudioApp/" data-layout="button_count" data-action="like" data-show-faces="true" data-share="true"></div>');
            //    //<div class="fb-share-button" data-href="https://www.facebook.com/MockupStudioApp/" data-layout="button_count"></div>
            //    $social.append(fbRoot).append(fbLike);
            //} else {
            var twitter = $('<iframe class="twitter-follow" src="https://platform.twitter.com/widgets/follow_button.html?screen_name=MockupStudioApp&show_screen_name=false&show_count=true&size=0"            title="Follow MockupStudioApp on Twitter"            width="80"   scrolling="no"         height="20"            style="border: 0; overflow: hidden;"            ></iframe>');
            $social.append(twitter);
            //}
            var fbShare = $('<iframe name="f2ee73c398" width="1000px" height="1000px" frameborder="0" allowtransparency="true" allowfullscreen="true" scrolling="no" title="fb:share_button Facebook Social Plugin" src="https://www.facebook.com/v2.5/plugins/share_button.php?app_id=113869198637480&amp;channel=https%3A%2F%2Fstaticxx.facebook.com%2Fconnect%2Fxd_arbiter.php%3Fversion%3D42%23cb%3Df1584ade54%26domain%3Ddevelopers.facebook.com%26origin%3Dhttps%253A%252F%252Fdevelopers.facebook.com%252Ff32c92ccbc%26relation%3Dparent.parent&amp;container_width=613&amp;href=https%3A%2F%2Fwww.facebook.com%2FMockupStudioApp%2F&amp;layout=button_count&amp;locale=en_US&amp;sdk=joey" style="border: none; visibility: visible; " class="fb-like"></iframe>');
            $social.append(fbShare);


        }

        function loadUserMenu(editor, menuBar) {
            if (!deip.isExtension) return;
            //editor.user = {};
            var userMenu = menuBar.userMenu = new Menu("Google Account", menuBar);
            var signInMenu = userMenu.signInMenu = new Menu("Sign In to Google", userMenu, deip.isFull ? "" : "Buy Now!");
            $(signInMenu.domElement).on("click", function (event) {
                if (deip.isExtension) {
                    if (signInMenu.disabled() == true) return;
                    editor.user.signIn(true).then(function (token) {
                        editor.user.updateUser();
                    });
                }
                else {
                    editor.purchase();
                }
            });

            signInMenu.disabled(!deip.isFull);

            var logOutMenu = userMenu.logOutMenu = new Menu("Sign Out from Google", userMenu);
            $(logOutMenu.domElement).on("click", function (event) {
                editor.user.signOut().then(function () {
                    swal("Logged Out!", "", "success");
                    editor.user.updateUser();
                });
            }).hide();

            var setDirectory = userMenu.setDirectory = new Menu("Choose Google Drive Directory", userMenu);
            $(setDirectory.domElement).on("click", function (event) {
                var directoryView = new google.picker.DocsView(google.picker.ViewId.FOLDERS).setIncludeFolders(!0).setMimeTypes("application/vnd.google-apps.folder").setMode(google.picker.DocsViewMode.LIST).setOwnedByMe(!0).setSelectFolderEnabled(!0);
                var picker = new google.picker.PickerBuilder()
                    .setTitle("Select Folder to Save Mockups")
                    .addView(directoryView)
                    .setOAuthToken(editor.user.token)
                    .setCallback(pickerCallBack)
                    .build();
                picker.setVisible(true);
            });

            var loadGoogleDriveMenu = menuBar.loadGoogleDriveMenu;
            $(loadGoogleDriveMenu.domElement).on("click", function (event) {

                if (loadGoogleDriveMenu.disabled()) return;
                if (deip.isExtension) {
                    var fileView = new google.picker.DocsView(google.picker.ViewId.DOCS)
                        .setIncludeFolders(!0)
                        .setOwnedByMe(!0)
                        .setParent(editor.user.folder.id)
                        .setSelectFolderEnabled(0)
                        .setMimeTypes("application/json, text/javascript, text/json, text/x-json");
                    var picker = new google.picker.PickerBuilder()
                        .setTitle("Select Mockup file to load")
                        .addView(fileView)
                        .setOAuthToken(editor.user.token)
                        .setCallback(pickerCallBack)
                        .build();
                    picker.setVisible(true);
                }
                else {
                    editor.getExtension();
                }
            });

            function showLogin(needLoggedIn) {
                if (needLoggedIn == true) {
                    $(logOutMenu.domElement).hide();
                    $(signInMenu.domElement).show();
                    $(setDirectory.domElement).hide();
                    loadGoogleDriveMenu.disabled(true);
                    userMenu.value("");
                    setDirectory.value("");
                    loadGoogleDriveMenu.value("");
                    $(menuBar.domElement).find(".login-profile-icon").remove();
                } else {
                    $(logOutMenu.domElement).show();
                    $(signInMenu.domElement).hide();
                    $(setDirectory.domElement).show();
                    loadGoogleDriveMenu.disabled(false);
                }
                $(userMenu.domElement).hide();
                $(loadGoogleDriveMenu.domElement).hide();
            }

            showLogin(true);


            editor.user.updateUser = function () {
                if (editor.user.token == undef) {
                    showLogin(true);
                }
                else {
                    editor.user.getProfile().then(function () {
                        showLogin(false);
                        chrome.storage.sync.get('googleDriveFolder', function (result) {
                            if (result !== undef) {
                                editor.user.folder = result.googleDriveFolder;
                                updateDriveLocation();
                            }
                        });
                        logOutMenu.value(editor.user.name);
                        userMenu.value("Logged in as: " + editor.user.name);
                        $(menuBar.domElement).find(".login-profile-icon").remove();
                        $(menuBar.domElement).prepend('<img class="login-profile-icon" src="' + editor.user.imageUrl + '" title="Logged in as: ' + editor.user.name + '">')
                    });
                }
            };

            // A simple callback implementation.
            function pickerCallBack(data) {
                //var url = 'nothing';

                if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
                    var doc = data[google.picker.Response.DOCUMENTS][0];
                    var docData = {
                        id: doc[google.picker.Document.ID],
                        name: doc[google.picker.Document.NAME]
                    };
                    if (doc.type == "folder") {
                        //url = doc[google.picker.Document.URL];
                        editor.user.folder = docData;
                        chrome.storage.sync.set({'googleDriveFolder': editor.user.folder});
                        updateDriveLocation();
                    }
                    else if (doc.type == "file") {
                        if (doc.mimeType.indexOf("json") > -1) {

                            var request = gapi.client.request({
                                path: "/drive/v2/files/" + docData.id + "?alt=media",
                                method: 'GET',
                                headers: {'Authorization': 'Bearer ' + editor.user.token}
                            }).then(function (response) {
                                var data = response.result;

                                function processFile() {
                                    swal.close();
                                    editor.reset();
                                    editor.user.file = docData;
                                    editor.currentFileName = docData.name;
                                    editor.updateTitle();
                                    editor.fromJSON(data);
                                }

                                if (data.stage == void 0) {
                                    data = JSON.parse(data);
                                }
                                if (data.stage == void 0) {
                                    swal({
                                        title: "Invalid File...",
                                        text: "The selected file ('" + docData.name + "') is invalid or currupted.",
                                        confirmButtonColor: editor.colors.red,
                                        confirmButtonText: "Use File Anyway!",
                                        closeOnConfirm: true

                                    }, function (isConfirm) {
                                        if (isConfirm) {
                                            processFile();
                                        }
                                    });
                                } else {
                                    processFile();
                                }
                            }, function (reason) {
                                swal.close();
                                console.log("Could not load file:" + reason);
                            });
                            swal({
                                title: "Loading data...",
                                text: "Loading : " + docData.name,
                                showConfirmButton: false
                            });
                        }
                        //load the json file.
                    }
                }
                //var message = 'You picked: ' + url;
                //console.log(message);
            }

            function updateDriveLocation() {
                setDirectory.value("Current Location: " + editor.user.folder.name);
                loadGoogleDriveMenu.value("Current Location: " + editor.user.folder.name);
            }

            /*
             function showLogin(needLoggedIn) {
             if (needLoggedIn == true) {
             $(logOutMenu.domElement).hide();
             $(signInMenu.domElement).show();
             $(setDirectory.domElement).hide();
             loadGoogleDriveMenu.disabled(true);
             } else {
             $(logOutMenu.domElement).show();
             $(signInMenu.domElement).hide();
             $(setDirectory.domElement).show();
             loadGoogleDriveMenu.disabled(false);
             }
             }

             function setBadgeNoAuth() {
             //showLogin(true);
             }

             function get(options) {
             var xhr = new XMLHttpRequest();
             xhr.onreadystatechange = function () {
             if (xhr.readyState === 4) {
             // JSON response assumed. Other APIs may have different responses.
             if (xhr.status === 200) {
             options.callback(JSON.parse(xhr.responseText));
             }
             else {
             console.log('get', xhr.readyState, xhr.status, xhr.responseText);
             }
             } else {
             //console.log('get', xhr.readyState, xhr.status, xhr.responseText);

             }
             };
             xhr.open("GET", options.url, true);
             // Set standard Google APIs authentication header.
             xhr.setRequestHeader('Authorization', 'Bearer ' + options.token);
             xhr.send();
             }

             function getProfile(token) {
             get({
             'url': 'https://www.googleapis.com/plus/v1/people/me',
             'callback': getProfileCallback,
             'token': token,
             });
             if (window.gapi && window.gapi.auth)
             gapi.auth.setToken({
             access_token: token
             });
             chrome.storage.sync.get('googleDriveFolder', function (result) {
             if (result !== undef) {
             editor.user.folder = result.googleDriveFolder;
             updateDriveLocation();
             }
             });
             showLogin(false);
             editor.user.token = token;
             }



             function getProfileCallback(person) {
             editor.user.name = person.displayName;
             editor.user.imageUrl = person.image.url;

             logOutMenu.value(editor.user.name);
             userMenu.value("Logged in as: " + editor.user.name);
             $(menuBar.domElement).find(".login-profile-icon").remove();
             $(menuBar.domElement).prepend('<img class="login-profile-icon" src="' + editor.user.imageUrl + '" title="Logged in as: ' + editor.user.name + '">')
             //showProfileNotification(options);
             }

             function getAuthToken(options) {
             chrome.identity.getAuthToken({'interactive': options.interactive}, options.callback);
             }

             function getAuthTokenSilent() {
             getAuthToken({
             'interactive': false,
             'callback': getAuthTokenSilentCallback,
             });
             }

             function getAuthTokenSilentCallback(token) {
             // Catch chrome error if user is not authorized.
             if (chrome.runtime.lastError) {
             showLogin(true);
             console.log("User not authorized");
             } else {
             getProfile(token);
             }
             }

             function getAuthTokenInteractive() {
             getAuthToken({
             'interactive': true,
             'callback': getAuthTokenInteractiveCallback,
             });
             }

             function getAuthTokenInteractiveCallback(token) {
             // Catch chrome error if user is not authorized.
             if (chrome.runtime.lastError) {
             showLogin(true);
             console.log("User not authorized");
             } else {
             getProfile(token);
             }
             }

             setBadgeNoAuth();
             getAuthTokenSilent();*/
        }

        function loadFileMenu(editor, menuBar) {
            var fileMenu = menuBar.fileMenu = new Menu("File", menuBar);
            var newMenu = fileMenu.newMenu = new Menu("New", fileMenu, "Ctrl+N");
            $(newMenu.domElement).on("click", function () {
                if (newMenu.disabled()) return;
                editor.changeMode(false);
                editor.newFile();
            });

            var isFull = deip.isFull = (editor.explorer !== undef);

            var isFullText = (isFull ? "" : " - Buy Now");

            deip.sendEvent("App", deip.actionType, (deip.isApp ? "App-" : "Web-") + 'Load');

            var loadFileMenu;
            if (deip.isApp) {
                loadFileMenu = fileMenu.loadFileMenu = new Menu("Load Mockup File", fileMenu, isFull ? "Ctrl+O" : "Buy Now!");
                $(loadFileMenu.domElement).on("click", function (event) {
                    editor.openFile();
                });
            } else {
                loadFileMenu = fileMenu.loadFileMenu = new Menu("Load Mockup File", fileMenu, isFull ? "Ctrl+O" : "Buy Now!");
                $(loadFileMenu.domElement).on("click", function (event) {
                    editor.openFile();
                });

                /*                var loadServerMenu = fileMenu.loadServerMenu = new Menu("My Mockups", fileMenu, isFull ? "Ctrl+Shift+O" : "Buy Now!");
                 $(loadServerMenu.domElement).on("click", function (event) {
                 editor.openFile(true);
                 });*/
                fileMenu.addSeparator();
                var loadGoogleDriveMenu = fileMenu.loadGoogleDriveMenu = new Menu("Load from Google Drive", undef, isFull ? "Ctrl+Shift+G" : "Buy Now!");
                //$(loadGoogleDriveMenu.domElement).hide();
                /*                $(loadGoogleDriveMenu.domElement).on("click", function (event) {
                 editor.openFile(true);
                 });*/
            }

            //if(editor.explorer!=undef) {
            var loadExamplesMenu = fileMenu.loadExamplesMenu = new Menu("Mockup Examples", fileMenu, "Ctrl+E");
            $(loadExamplesMenu.domElement).on("click", function (event) {
                editor.quickstart.show();
            });
            //}
            fileMenu.addSeparator();
            /*            var saveMenu = fileMenu.saveMenu = new Menu("Save Mockup", fileMenu, isFull ? "Ctrl+S" : "Buy Now!");
             $(saveMenu.domElement).on("click", function (event) {
             if (saveMenu.disabled()) return;
             editor.saveFile();
             });
             var saveAsMenu = fileMenu.saveAsMenu = new Menu("Save As", fileMenu, isFull ? "Ctrl+Shift+S" : "Buy Now!");
             $(saveAsMenu.domElement).on("click", function (event) {
             if (saveAsMenu.disabled()) return;
             editor.saveFile(true);
             });
             fileMenu.addSeparator();*/
            var saveToFileMenu = fileMenu.saveToFileMenu = new Menu("Save to File", fileMenu, isFull ? "Ctrl+S" : "Buy Now!");
            $(saveToFileMenu.domElement).on("click", function (event) {
                if (saveToFileMenu.disabled()) return;
                editor.saveToFile(true);
            });
            fileMenu.addSeparator();
            loadUserMenu(editor, fileMenu);
        }

        function loadAddMenu(editor, menuBar) {
            var addMenu = menuBar.addMenu = new Menu("Add", menuBar);
            var addCopy = addMenu.addCopy = new Menu("Copy", addMenu, "Ctrl+V");
            $(addCopy.domElement).on("click", function (event) {
                if (!addCopy.disabled() && !addMenu.disabled()) {
                    if (editor.selected == undef) return;
                    var copy = editor.selected.createCopy();
                    editor.changeMode(false);
                    editor.stage.add(copy);
                    editor.selectObject(copy);
                }
            });
            var addClone = addMenu.addClone = new Menu("Clone", addMenu, "Ctrl+C");
            $(addClone.domElement).on("click", function (event) {
                if (!addClone.disabled() && !addMenu.disabled()) {
                    if (editor.selected == undef) return;
                    var clone = editor.selected.createClone();
                    editor.changeMode(false);
                    editor.stage.add(clone);
                    editor.selectObject(clone);
                }
            });
            var removeObject = addMenu.removeObject = new Menu("Delete Object", addMenu, "Delete");
            $(removeObject.domElement).on("click", function (event) {
                if (!removeObject.disabled() && !addMenu.disabled()) {
                    if (editor.selected == undef) return;
                    swal({
                        title: "Delete?",
                        text: "Delete the current object?",
                        type: "warning",
                        showCancelButton: true,
                        confirmButtonColor: editor.colors.red,
                        confirmButtonText: "Delete it!",
                        closeOnConfirm: true
                    }, function (isConfirm) {
                        if (isConfirm) {
                            editor.changeMode(false);
                            var object = editor.selected;
                            //clear clone issue, set a new parent to big brother
                            var cloneIndexes = editor.stage.getIndexesByProperty("cloneParent", object.uuid);
                            if (cloneIndexes.length > 1) {

                                var bigBrotherId = editor.stage.children[cloneIndexes[0]].uuid;
                                editor.stage.children[cloneIndexes[0]].cloneParent = undef;
                                for (var index = 1; index < cloneIndexes.length; index++) {
                                    var clone = editor.stage.children[cloneIndexes[index]];
                                    clone.cloneParent = bigBrotherId;
                                }
                            }
                            editor.stage.remove(editor.selected)
                            editor.selectObject(null);
                        }
                    });
                }
            });

            addMenu.addSeparator();

            //load menu from MOCKUP.presets

            for (var key in MOCKUP.presets) {
                if (key !== "options") {
                    var preset = MOCKUP.presets[key];
                    var menu = preset.menu;

                    if (menu != undef && menu !== {}) {

                        var addPreset = addMenu["add" + key] = new Menu(menu.name, addMenu);
                        var subMenus = menu.subMenu;

                        if (subMenus !== undef && subMenus !== {}) {

                            for (var subKey in subMenus) {
                                var subMenu = subMenus[subKey];

                                if (subMenu !== undef && subMenu !== {}) {
                                    var subMenuUI = new Menu(subMenu.name, addPreset);
                                    $(subMenuUI.domElement).on("click", function () {
                                        if (addMenu.disabled()) return;
                                        var _type = $(this).data("class");
                                        var parentKey = _type.split(".")[0];
                                        var selfType = _type.split(".")[1];
                                        var options = $.extend({}, MOCKUP.presets[parentKey].options, MOCKUP.presets[parentKey].menu.subMenu[selfType].options);
                                        options.subType = selfType;
                                        editor.changeMode(false);
                                        editor.addNew(parentKey, options);
                                    });
                                    $(subMenuUI.domElement).data("class", key + "." + subKey);

                                    if (subMenu.addSeperator)
                                        addPreset.addSeparator();
                                }
                            }
                        }

                        if (menu.addSeperator)
                            addMenu.addSeparator();
                    }
                }
            }
        }

        function loadHelpMenu(editor, menuBar) {

            var helpMenu = menuBar.helpMenu = new Menu("Help", menuBar);

            /*            $(helpMenu.domElement).on("click", function (event) {
             var url = "./documentation/index.html";
             window.open(url, '_blank');
             });*/
            var subMenus = MOCKUP.Help.subMenu;
            if (subMenus !== undef && subMenus !== {}) {

                for (var subKey in subMenus) {
                    var subMenu = subMenus[subKey];

                    if (subMenu !== undef && subMenu !== {}) {
                        var subMenuUI = new Menu(subMenu.name, helpMenu);
                        var url = subMenu.url;
                        $(subMenuUI.domElement).on("click", function () {
                            var url = $(this).data("url");
                            window.open(url, '_blank');
                        });
                        $(subMenuUI.domElement).data("url", url);

                        if (subMenu.addSeperator)
                            helpMenu.addSeparator();
                    }
                }
            }
        }

        function initializeControls(editor) {

            var controls = editor.controls = new function () {

                var defaults = this.defaults = {
                    shadowDarkness: 0.3,
                    shadowBlur:5,
                    lightPosition: 310,
                    ambient: 0.5,
                    lightIntensity: 0.6,
                    lightRadius: 1000,
                    lightHeight: 1000,
                    softShadow: false,
                    showLightHelper: false
                }
                this.reset = function () {
                    var gp = editor.globalProperties;
                    gp.lightIntensity.setValue(defaults.lightIntensity);
                    gp.ambient.setValue(defaults.ambient);
                    gp.shadowDarkness.setValue(defaults.shadowDarkness);
                    gp.lightPosition.setValue(defaults.lightPosition);
                    gp.lightRadius.setValue(defaults.lightRadius);
                    gp.lightHeight.setValue(defaults.lightHeight);
                    gp.softShadow.setValue(defaults.softShadow);
                    gp.showLightHelper.setValue(defaults.showLightHelper);
                };

                this.width = 297;
                this.height = 210;
                this.foldAngle1 = 30;
                this.foldAngle2 = 120;
                this.shadowDarkness = defaults.shadowDarkness;
                this.shadowBlur = defaults.shadowBlur;
                this.lightPosition = defaults.lightPosition;
                this.stiffness = 0.02;
                this.ambient = defaults.ambient;
                this.lightIntensity = defaults.lightIntensity;
                this.bumpSize = 0.4;
                this.shininess = 30;
                this.lightRadius = defaults.lightRadius;
                this.lightHeight = defaults.lightHeight;
                this.softShadow = defaults.softShadow;
                this.showLightHelper = defaults.showLightHelper;
                //ground texture repeat
                this.repeat = 100;
                //ui properties
                this.screenSize = 5.0;
                this.resolutionHeight = 1920.0;
                this.resolutionWidth = 1080.0;

                this.updateWidth = function () {

                    if (editor.skipPropertyUpdate == true) return;

                    var target = editor.getSelectedTarget();
                    if (target instanceof MOCKUP.Ground) return;

                    if (target.widthScale == controls.width / target.width) {
                        return;
                    }
                    //if (target.width == controls.width) return;
                    if (target.updateAngle !== undef) {
                        target.width = controls.width;
                        target.updateAngle();
                        editor.selectionBox.update(editor.defaultObject);
                    }
                    else {
                        target.widthScale = controls.width / target.width;
                        target.scale.x = target.widthScale;
                        editor.selectionBox.update(editor.defaultObject);
                    }
                };

                this.updateHeight = function () {
                    if (editor.skipPropertyUpdate == true) return;

                    var target = editor.getSelectedTarget();
                    if (target instanceof MOCKUP.Ground) return;

                    if (target.heightScale == controls.height / target.height) return;

                    target.heightScale = controls.height / target.height;
                    target.scale.y = target.heightScale;
                    editor.selectionBox.update(editor.defaultObject);
                };
                this._updateUIDimension = function (target) {
                    if (target instanceof MOCKUP.Ground) return;
                    target.screenSize = MOCKUP.inchTomm(controls.screenSize);
                    target.resolutionHeight = controls.resolutionHeight;
                    target.resolutionWidth = controls.resolutionWidth;

                    var aspectRatio = target.resolutionHeight / target.resolutionWidth;
                    var newHeight = target.screenSize * aspectRatio / Math.sqrt(aspectRatio * aspectRatio + 1);
                    var newWidth = newHeight / aspectRatio;

                    if (controls.screenSize <= 1) {
                        var textureHeight = target.material.materials[4].map.naturalHeight;
                        var textureWidth = target.material.materials[4].map.naturalWidth;

                        if (textureHeight !== undef && textureWidth !== undef) {
                            newHeight = textureHeight / 10;
                            newWidth = textureWidth / 10;
                        }
                    }

                    target.widthScale = newWidth / target.width;
                    target.scale.x = target.widthScale;

                    target.heightScale = newHeight / target.height;
                    target.scale.y = target.heightScale;
                };
                this.updateUIDimension = function () {
                    if (editor.skipPropertyUpdate == true) return;
                    var target = editor.getSelectedTarget();
                    if (target !== undef) {
                        controls._updateUIDimension(target);
                    }
                    editor.selectionBox.update(editor.defaultObject);
                };

                this.updateAngle = function () {
                    if (editor.skipPropertyUpdate == true) return;
                    var target = editor.getSelectedTarget();
                    if (target !== undef && target.angles !== undef) {
                        if (target.angles[1] == controls.foldAngle1 && target.angles[4] == controls.foldAngle2 && target.stiffness == controls.stiffness) return;
                        target.angles = [0, controls.foldAngle1, 0, 0, controls.foldAngle2, 0];
                        target.stiffness = controls.stiffness;
                        if (target.updateAngle !== undef) {
                            target.updateAngle();
                            editor.selectionBox.update(editor.defaultObject);
                        }
                    }
                };

                this.enableSoftShadow = function () {
                    editor.stage.enableSoftShadow(controls.softShadow);
                };

                this.enableLightHelper = function () {
                    editor.stage.spotLightHelper.visible = controls.showLightHelper;
                };

                this.updateShininess = function () {
                    var target = editor.getSelectedTarget();
                    if (target.shininess !== undef) target.shininess(controls.shininess);
                };

                this.updateLightDarkness = function () {
                    editor.stage.spotLight.shadowDarkness = controls.shadowDarkness;
                };

                this.updateShadowBlur = function () {
                    editor.stage.spotLight.shadowBlur = controls.shadowBlur;
                };

                this.updateAmbient = function () {
                    var colorValue = Math.floor(controls.ambient * 255);
                    editor.stage.ambientLight.color = new THREE.Color("rgb(" + colorValue + "," + colorValue + "," + colorValue + ")");
                };

                this.updateLightIntensity = function () {
                    editor.stage.spotLight.intensity = controls.lightIntensity;
                };

                this.updateLightPosition = function () {
                    var radius = controls.lightRadius;
                    var height = controls.lightHeight;
                    var angle = controls.lightPosition * Math.PI / 180;
                    var spotLight = editor.stage.spotLight;
                    spotLight.radius = radius;
                    spotLight.position.x = spotLight.radius * Math.cos(angle);
                    spotLight.position.z = spotLight.radius * Math.sin(angle);
                    spotLight.position.y = height;
                    spotLight.lookAt(new THREE.Vector3(0, 0, 0));
                    //this.stage.spotLight.position = controls.shadowDarkness;
                };

                this.backImage = function () {
                    editor.objectProperties.backImage.hiddenFileInput.click();
                };

                this.frontImage = function () {
                    editor.objectProperties.frontImage.hiddenFileInput.click();
                };

                this.updateBumpSize = function () {
                    var target = editor.getSelectedTarget();
                    if (target.bumpScale !== undef) target.bumpScale(controls.bumpSize);
                };

                this.updateRepeat = function () {
                    var target = editor.getSelectedTarget();
                    if (target.textureRepeat !== undef) target.textureRepeat(controls.repeat);
                }
            };

            //extend dat controls visibility
            dat.controllers.NumberControllerBox.prototype.setVisibility =
                dat.controllers.BooleanController.prototype.setVisibility =
                    dat.controllers.ColorController.prototype.setVisibility =
                        dat.controllers.FunctionController.prototype.setVisibility =
                            dat.controllers.NumberControllerBox.prototype.setVisibility =
                                dat.controllers.NumberControllerSlider.prototype.setVisibility =
                                    dat.controllers.OptionController.prototype.setVisibility =
                                        dat.controllers.StringController.prototype.setVisibility =
                                            dat.controllers.Controller.prototype.setVisibility =
                                                function (visibility) {
                                                    var target = $(this.domElement).closest("li");
                                                    if (visibility) {
                                                        target.show();
                                                    }
                                                    else {
                                                        target.hide();
                                                    }
                                                    return this;
                                                };
            dat.controllers.NumberControllerBox.prototype.setText =
                dat.controllers.BooleanController.prototype.setText =
                    dat.controllers.ColorController.prototype.setText =
                        dat.controllers.FunctionController.prototype.setText =
                            dat.controllers.NumberControllerBox.prototype.setText =
                                dat.controllers.NumberControllerSlider.prototype.setText =
                                    dat.controllers.OptionController.prototype.setText =
                                        dat.controllers.StringController.prototype.setText =
                                            dat.controllers.Controller.prototype.setText =
                                                dat.controllers.Controller.prototype.setText = function (text) {
                                                    $(this.domElement).closest("li").find(".property-name").text(text);
                                                    return this;
                                                };
        }

        function addGlobalControls(editor) {
            var controls = editor.controls;
            var gp = editor.globalProperties = editor.gui.addFolder('Global Properties');
            gp.lightIntensity = gp.add(controls, 'lightIntensity', 0.00, 1.0).step(0.01).onChange(controls.updateLightIntensity).setText("Light Intensity");
            gp.ambient = gp.add(controls, 'ambient', 0, 1).step(0.01).onChange(controls.updateAmbient).setText("Ambience");
            gp.lightPosition = gp.add(controls, 'lightPosition', 0, 360).min(0).step(1).onChange(controls.updateLightPosition).setText("Light Position(Angle)");
            gp.lightRadius = gp.add(controls, 'lightRadius', 0, 2000).min(0).step(1).onChange(controls.updateLightPosition).setText("Light Position(Radius)");
            gp.lightHeight = gp.add(controls, 'lightHeight', 0, 5000).min(10).step(1).onChange(controls.updateLightPosition).setText("Light Position(Height)");
            gp.showLightHelper = gp.add(controls, 'showLightHelper').onChange(controls.enableLightHelper).setText("Enable Light Helper");

            gp.shadowDarkness = gp.add(controls, 'shadowDarkness', 0.00, 0.99).min(0.00).step(0.01).onChange(controls.updateLightDarkness).setText("Shadow Darkness");
            gp.shadowBlur = gp.add(controls, 'shadowBlur', 0, 10).min(0.00).step(0.01).onChange(controls.updateShadowBlur).setText("Shadow Blur");
            gp.softShadow = gp.add(controls, 'softShadow').onChange(controls.enableSoftShadow).setText("Enable Preview(Slow)");
            if (deip.isFull != false) gp.open();

            gp.lightIntensity.setValue(controls.defaults.lightIntensity);
            gp.lightPosition.setValue(controls.defaults.lightPosition);
            gp.ambient.setValue(controls.defaults.ambient);
            gp.shadowDarkness.setValue(controls.defaults.shadowDarkness);

            if (MOCKUP.mode == MOCKUP.MODE.PLUGIN) {
                gp.shadowDarkness.setVisibility(false);
                gp.lightPosition.setValue(110);
                gp.ambient.setValue(controls.defaults.ambient);
            }
        }

        function addObjectControls(editor) {
            var controls = editor.controls;
            var op = editor.objectProperties = editor.gui.addFolder('Object Properties');
            op.width = op.add(controls, 'width', 20).step(0.1).onChange(controls.updateWidth).setText("Width");
            op.height = op.add(controls, 'height', 20).step(0.1).onChange(controls.updateHeight).setText("Height");

            op.screenSize = op.add(controls, 'screenSize', 1, 17).step(0.1).onChange(controls.updateUIDimension).setText("Screen Size");
            op.resolutionWidth = op.add(controls, 'resolutionWidth', 240).step(0.1).onChange(controls.updateUIDimension).setText("Resolution Width");
            op.resolutionHeight = op.add(controls, 'resolutionHeight', 240).step(0.1).onChange(controls.updateUIDimension).setText("Resolution Height");

            op.foldAngle1 = op.add(controls, 'foldAngle1', 0, 180).step(0.5).onChange(controls.updateAngle).setText("First Fold Angle");
            op.foldAngle2 = op.add(controls, 'foldAngle2', 0, 180).onChange(controls.updateAngle).setText("Second Fold Angle");
            op.shininess = op.add(controls, 'shininess', 0, 100).step(1).onChange(controls.updateShininess).setText("Gloss");
            op.stiffness = op.add(controls, 'stiffness', 0, 1).step(0.01).onChange(controls.updateAngle).setText("Paper Flexibility");
            op.bumpSize = op.add(controls, 'bumpSize', 0, 5).step(0.1).onChange(controls.updateBumpSize).setText("Texture Bump Size");
            op.repeat = op.add(controls, 'repeat', 1, 500).step(5).onChange(controls.updateRepeat).setText("Texture Repeat");
            op.backImage = op.add(controls, 'backImage').setText("Change Back Image");
            op.frontImage = op.add(controls, 'frontImage').setText("Change Front Image");
            if (deip.isFull != false) op.open();

            var sendToTexture = function (target, type, image) {
                if (type == "frontImage") {
                    target.frontImage(image, function (object) {
                        if (object.screenSize !== undef) {
                            controls._updateUIDimension(object);
                        }
                    });
                }
                else {
                    target.backImage(image);
                }
                //editor.autosave();
            };
            //convert normal dat function controller to a image controller
            var convertToImageController = function (controller) {
                controller.hiddenFileInput = $("<input type='file' class='hidden-input' accept='image/*'>");
                $(controller.domElement).append(controller.hiddenFileInput);
                controller.hiddenFileInput.change(function () {
                    var files = controller.hiddenFileInput[0].files;
                    var file;
                    if (files.length) {
                        file = files[0];
                        file.upload = {
                            progress: 0,
                            total: file.size,
                            bytesSent: 0
                        };
                        var target = editor.getSelectedTarget();
                        var testFile = "textures/" + file.lastModified + "." + file.size;
                        MOCKUP.checkFile(testFile,
                            function () {
                                controller.hiddenFileInput.val("");
                                sendToTexture(target, controller.property, testFile);
                            },
                            function () {
                                var fileReader;
                                fileReader = new FileReader;
                                fileReader.onload = (function (file) {
                                    return function () {
                                        controller.hiddenFileInput.val("");
                                        var image = fileReader.result;
                                        MOCKUP.needSave = true;
                                        MOCKUP.saveFileName = testFile;
                                        sendToTexture(target, controller.property, image);
                                    };
                                })(file);
                                fileReader.readAsDataURL(file);
                            });
                    }
                });
            };

            convertToImageController(op.frontImage);
            convertToImageController(op.backImage);


        }

        function addTips(editor) {

            if (window.mockupTips !== undef) {
                var wrapperParent = $(editor.objectProperties.domElement).parent().parent();
                for (var count = 0; count < window.mockupTips.length; count++) {
                    var tip = window.mockupTips[count];
                    var $tip = $("<div>", {
                        class: 'mockup-tips' + (count == 0 ? " active-tip" : ""),
                        on: {
                            "click": function () {
                                var $this = $(this).removeClass("active-tip");

                                var parent = $this.parent();
                                var next = $this.next();
                                if (next.length == 0) next = parent.find(".mockup-tips:first");
                                next.addClass("active-tip");
                            }
                        },
                        html: tip
                    }).appendTo(wrapperParent);
                }
            }
        }


        Editor.prototype.getNewFileName = function () {
            return this.untitledFileName;// + Math.random().toString().split(".")[1];
        };

        Editor.prototype.selectObject = function (object) {

            if (this.selected === object) return;
            var uuid = null;
            if (object) uuid = object.uuid;
            this.selected = object;

            this.selectionBox.visible = false;
            this.transformControls.detach();

            if (object) {

                if (object.geometry !== undef &&
                    object instanceof THREE.Sprite === false) {

                    this.selectionBox.update(object);
                    this.selectionBox.visible = true;

                }
                else if (object instanceof MOCKUP.Bundle) {
                    this.selectionBox.update(object);
                    this.selectionBox.visible = true;
                }
                this.defaultObject = object;
                if (this.previewMode != true) this.transformControls.attach(object);
                this.cloneSelection.selectClones(object);
            }
            else
                this.cloneSelection.selectClones(this.stage.ground);
            this.updateControls(object);
            this.updateMenuPresets(object);
            //this.stage.render();
            this.stage.renderRequestPending = true;
            //this.autosave();
        };

        Editor.prototype.updateControls = function (object) {

            if (object instanceof  MOCKUP.Bundle) {
                object = object.mainObject;
            }
            var isObject = object !== undef && object !== null;
            //Only paper objects that are not ground
            var showDimension = isObject && !(object.type == "Ground" || object.type == "UI" ) && object instanceof MOCKUP.Paper;

            this.skipPropertyUpdate = true;
            var op = this.objectProperties;

            //updateVisibility
            op.width.setVisibility(showDimension);
            op.height.setVisibility(showDimension);
            op.foldAngle1.setVisibility(isObject && object.updateAngle !== undef);
            op.foldAngle2.setVisibility(isObject && object.updateAngle !== undef);
            op.stiffness.setVisibility(isObject && object.updateAngle !== undef);
            op.backImage.setVisibility(isObject && object.backImage !== undef);
            op.repeat.setVisibility(isObject && object.textureRepeat !== undef);
            op.shininess.setVisibility(isObject && object.shininess !== undef);
            op.bumpSize.setVisibility(isObject && object.bumpScale !== undef);
            op.frontImage.setVisibility(isObject && object.frontImage !== undef);
            op.backImage.setVisibility(isObject && object.backImage !== undef);

            op.resolutionHeight.setVisibility(isObject && object.resolutionHeight !== undef);
            op.resolutionWidth.setVisibility(isObject && object.resolutionWidth !== undef);
            op.screenSize.setVisibility(isObject && object.screenSize !== undef);

            //updateValues
            if (isObject) {

                if (showDimension) {
                    op.width.setValue(object.width * object.widthScale);
                    op.height.setValue(object.height * object.heightScale);
                }

                op.stiffness.setValue(object.stiffness);
                if (object.updateAngle !== undef) {
                    op.foldAngle1.setValue(object.angles[1]);
                    op.foldAngle2.setValue(object.angles[4]);
                }

                if (object.geometryType !== undef) {
                    if (object.geometryType == MOCKUP.GEOMETRY_TYPE.BOX) {
                        if (object.bumpScale) op.bumpSize.setValue(object.material.materials[4].bumpScale);
                        if (object.shininess) op.shininess.setValue(object.material.materials[4].shininess);
                    }
                    else {
                        op.bumpSize.setValue(object.material.bumpScale);
                        op.shininess.setValue(object.material.shininess);
                    }
                }

                if (object.type == "Ground") {
                    op.repeat.setValue(object.textureRepeat());
                }
                else if (object instanceof  MOCKUP.FoldBoxPaper) {

                }
                else if (object instanceof MOCKUP.UI) {
                    op.resolutionHeight.setValue(object.resolutionHeight);
                    op.resolutionWidth.setValue(object.resolutionWidth);
                    op.screenSize.setValue(MOCKUP.mmToInch(object.screenSize));
                }
            }
            this.skipPropertyUpdate = false;
        };

        function clearPresets() {
            $(".nav-item[data-type='none']").trigger("click");
        }

        Editor.prototype.updateUser = function (data) {

        };
        Editor.prototype.updateMenuPresets = function (object) {
            if (object == undef || object == null) {
                clearPresets();
                return;
            }
            var type = object.type;
            var $preset = $(".nav-item[data-type='" + type + "']");
            if ($preset.length > 0) $preset.trigger("click");
            else clearPresets();
            editor.menubar.addMenu.addCopy.disabled(type == "Ground");
            editor.menubar.addMenu.addClone.disabled(type == "Ground");
            editor.menubar.addMenu.removeObject.disabled(type == "Ground");
        };

        Editor.prototype.getSelectedTarget = function () {
            if (this.transformControls.object == undef)
                return this.defaultObject;
            else
                return this.transformControls.object;
        };

        Editor.prototype.download = function (width, height, isThumb, thumbCallback) {

            if (width == undef || height == undef) {
                width = this.downloadWidth;
                height = this.downloadHeight;
            }
            var thumb;
            var editor = this;
            editor.selectObject(null);

            if (isThumb == undef) {
                swal({
                    title: "Please Wait!",
                    text: "Generating Image",
                    showConfirmButton: false
                });
                setTimeout(function () {
                    var _spotLightHelperVisibility = editor.stage.spotLightHelper.visible;
                    editor.stage.spotLightHelper.visible = false;


                    if (width <= editor.testWidth) {
                        editor.stage.resizeCanvas(width * 2, height * 2);

                        if (!editor.controls.softShadow) editor.stage.enableSoftShadow(true);

                        editor.stage.render();
                        var canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;

                        var context = canvas.getContext('2d');
                        context.drawImage(editor.renderer.domElement, 0, 0, width * 2, height * 2, 0, 0, width, height);

                        canvas.toBlob(function (blob) {
                            saveAs(
                                blob, "mockup.jpg"
                            );
                        }, "image/jpeg", editor.imageQuality);

                    }
                    else {
                        editor.stage.resizeCanvas(width, height);

                        if (!editor.controls.softShadow) editor.stage.enableSoftShadow(true);

                        //editor.renderer.render(editor.stage, editor.camera);
                        editor.stage.render();
                        editor.renderer.domElement.toBlob(function (blob) {
                            saveAs(
                                blob, "mockup.jpg"
                            );
                        }, "image/jpeg", editor.imageQuality);
                    }
                    editor.resize();
                    editor.selectObject(editor.defaultObject);
                    if (!editor.controls.softShadow) editor.stage.enableSoftShadow(false);

                    swal.close();
                    editor.stage.spotLightHelper.visible = _spotLightHelperVisibility;
                }, 50);
            }
            else {
                var _spotLightHelperVisibility = editor.stage.spotLightHelper.visible;
                editor.stage.spotLightHelper.visible = false;

                this.stage.resizeCanvas(width, height);

                this.renderer.render(this.stage, this.camera);

                if (thumbCallback == undef) {
                    thumb = this.renderer.domElement.toDataURL("image/png", editor.thumbnailQuality);
                }
                else {
                    editor.renderer.domElement.toBlob(function (blob) {
                        thumbCallback(blob);
                    }, "image/jpeg", editor.imageQuality);
                }
                editor.resize();
                editor.selectObject(editor.defaultObject);

                editor.stage.spotLightHelper.visible = _spotLightHelperVisibility;

                if (thumbCallback == undef)
                    return thumb;

            }

            deip.sendEvent('Buttons', deip.actionType, 'Get Image');
        };

        Editor.prototype.purchase = function () {
            var editor = this;
            swal({
                title: "This function requires Full Extension version!",
                text: "Loading and Saving are limited in web mode. You need a full version of Mockup Studio Chrome Extension. You can get it from CodeCanyon",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: editor.colors.blue,
                confirmButtonText: "Get it Now!",
                closeOnConfirm: true
            }, function (isConfirm) {
                if (isConfirm) {
                    $("#purchase_link")[0].click();
                    deip.sendEvent('Buttons', deip.actionType, 'Buy It');
                }
            });
        };

        Editor.prototype.getExtension = function () {
            var editor = this;
            swal({
                title: "This function is available on Chrome Extension!",
                text: "You can get it from WebStore",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: editor.colors.blue,
                confirmButtonText: "Get it Now!",
                closeOnConfirm: true
            }, function (isConfirm) {
                if (isConfirm) {
                    $("#extension_link")[0].click();
                    deip.sendEvent('Buttons', deip.actionType, 'Get Extension');
                }
            });

        };
        Editor.prototype.resize = function () {
            if (this.menubar !== undef && this.globalProperties !== undef) {
                var height = this.container.height() - $(this.menubar.domElement).height();
                var width = this.container.width() - $(this.globalProperties.domElement).width();
                this.stage.resizeCanvas(width, height);
            }
        };

        Editor.prototype.beforeUnload = function (event) {
            var editor = this;
            editor.autosave(true);
            swal({
                title: "Auto close alert!",
                text: "Saving data.",
                timer: 2000,
                showConfirmButton: false
            });
            return false;
        };

        Editor.prototype.addNew = function (type, settings) {
            var presetOption = MOCKUP.presets[type];
            settings = $.extend({}, presetOption == undef ? {} : presetOption.options, settings);
            var mockup = new MOCKUP[type](settings, this.stage);
            if (mockup.geometry) {
                this.stage.add(mockup);
                this.selectObject(mockup);
                $(".menu-item:first-child").trigger("click");
                this.autosave();
            }
        };

        Editor.prototype.newFile = function () {
            var editor = this;
            swal({
                title: "Unsaved Data!!",
                text: "You will loose any unsaved data. Continue?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: editor.colors.blue,
                confirmButtonText: "Create New!",
                closeOnConfirm: true
            }, function (isConfirm) {
                if (isConfirm) {
                    editor.reset();
                }
            });
        };

        Editor.prototype.changeMode = function (isPreview) {
            if (isPreview == true) {
                this.container.addClass("preview");
                this.transformControls.visible = false;
                this.transformControls.detach();
                this.previewMode = true;
            }
            else {
                this.container.removeClass("preview");
                this.previewMode = false;
                this.transformControls.visible = true;
                if (this.selected)
                    this.transformControls.attach(this.selected)
            }
            //this.menubar.addMenu.disabled(isPreview == true);
            //this.menubar.fileMenu.newMenu.disabled(isPreview == true);
            //this.menubar.fileMenu.saveMenu.disabled(isPreview == true);
            //this.menubar.fileMenu.saveAsMenu.disabled(isPreview == true);
            this.stage.renderRequestPending = true;

        };

        Editor.prototype.updateTitle = function () {
            var fileName = this.currentFileName;
            if (fileName) {
                this.titleBar.updateTitle(fileName + " - MOCKUP Studio");
            }
        };

        Editor.prototype.clearChild = function (child) {
            var material = child.material;
            child.parent.remove(child);
            var texture;
            if (child.dispose !== undef)
                child.dispose();
            if (child.geometry !== undef)
                child.geometry.dispose();
            if (material == undef) return;

            if (material.materials == undef) {
                if (material.map) {
                    texture = material.map;
                    material.dispose();
                    texture.dispose();
                }
                if (material.bumpMap) {
                    texture = material.bumpMap;
                    material.dispose();
                    texture.dispose();
                }

            }
            else {
                for (var matCount = 0; matCount < material.materials.length; matCount++) {
                    if (material.materials[matCount]) {
                        if (material.materials[matCount].map) {
                            texture = material.materials[matCount].map;
                            material.materials[matCount].dispose();
                            texture.dispose();
                        }
                        if (material.materials[matCount].bumpMap) {
                            texture = material.materials[matCount].bumpMap;
                            material.materials[matCount].dispose();
                            texture.dispose();
                        }
                    }

                    material.materials[matCount] = null;

                }
            }
            material = null;
            texture = null;
        }
        //TODO: reset is not perfect
        // lacks global properties
        Editor.prototype.reset = function (clearData) {
            var editor = this;
            this.selectObject(null);
            //console.log("editor reset");
            //make new filename
            this.currentFileName = this.getNewFileName();
            this.updateTitle();
            //clear objects from the scene

            var stage = this.stage;

            function clearChild(child) {

                if (clearData == undef || clearData == true) {

                    MOCKUP.clearChild(child);
                }
            };
            var totalChild = stage.children.length;
            for (var count = totalChild - 1; count >= 0; count--) {
                var child = stage.children[count];
                if (child === stage.ground) {

                    if (child.material.map && child.material.map.sourceFile !== MOCKUP.defaults.groundTexture && clearData !== false) {
                        child.material.map.dispose();
                        child.material.bumpMap.dispose();

                        child.frontImage(MOCKUP.defaults.groundTexture);
                    }
                    child.material.shininess = MOCKUP.paperDefaults.shininess;
                    child.material.bumpScale = 0.1;
                    child.textureRepeat(MOCKUP.paperDefaults.repeat);

                    child.position.set(0, -1, 0);
                    child.rotation.set(-Math.PI / 2, 0, 0);
                }
                else if (child === this.stage.spotLight) {

                }
                else if (child === this.stage.ambientLight) {

                }
                else if (child instanceof THREE.TransformControls) {
                }
                else if (child instanceof THREE.CameraHelper) {
                    if (child != this.stage.spotLightHelper)
                        clearChild(child);
                }
                else if (child instanceof THREE.BoxHelper) {

                }
                else if (child instanceof MOCKUP.Bundle) {
                    for (var stackCount = child.children.length - 1; stackCount >= 0; stackCount--) {
                        clearChild(child.children[stackCount]);
                    }
                    child.parent.remove(child);
                }
                else {
                    clearChild(child);
                }
            }
            this.stage.camera.position.set(-300, 300, 300);
            this.stage.camera.lookAt(new THREE.Vector3(0, 0, 0));
            this.orbitControl.center.set(0, 0, 0);
            this.orbitControl.update();

            //reset Global Properties

            this.controls.reset();

            //clear object selection
            this.selectObject(null);
            this.stage.clearMaterials();
            this.cloneSelection.cloneHelpers = [];
            this.stage.render();
            if (clearData == undef || clearData == true) this.clearAutoSave();

            if (editor.user)
                editor.user.file = undef;
        };

        var timeout;
        var autosave = function (editor) {

            var start = performance.now();

            // Get a value
            var data = editor.toJSON();

            var onsuccess = function (event) {

                console.log('[' + /\d\d\:\d\d\:\d\d/.exec(new Date())[0] + ']', 'Saved state to IndexedDB. ' + ( performance.now() - start ).toFixed(2) + 'ms');
                //console.log("saved");
            };

            editor.db.autosave.put({
                data: data, timestamp: Math.floor(Date.now()), id: "0"
            }).then(function () {
                onsuccess();
            }).catch(function (err) {
                console.error("Could not autosave to database:" + err.message);
            }).finally(function () {
                // Do what should be done next...
            });
            /*            if (deip.isApp) {
             // Save it using the Chrome extension storage API.
             chrome.storage.local.set({'autosave': data}, onsuccess);
             }
             else {
             var transaction = editor.database.transaction(['autosave'], 'readwrite');
             var objectStore = transaction.objectStore('autosave');
             var request = objectStore.put(data, 0);
             request.onsuccess = onsuccess;
             }*/

        };

        Editor.prototype.autosave = function (quick) {
            var editor = this;
            clearTimeout(timeout);
            if (quick) {
                autosave(editor);
            } else {

                timeout = setTimeout(function () {

                    timeout = setTimeout(autosave, 100, editor);

                }, 1000);
            }
        };

        Editor.prototype.clearAutoSave = function () {
            if (deip.isApp) {
                chrome.storage.local.set({'autosave': undef}, function () {
                    // Notify that we saved.
                    //console.log(data);
                });
            }
            else {
                editor.db.autosave.delete("0").then(function () {
                    console.log("AutoSave Cleared.");
                }).catch(function (err) {
                    console.error("Could not autosave to database:" + err.message);
                }).finally(function () {
                    // Do what should be done next...
                });
                /*var transaction = this.database.transaction(['autosave'], 'readwrite');
                 var objectStore = transaction.objectStore('autosave');
                 var request = objectStore.clear();
                 request.onsuccess = function (event) {
                 };*/
            }
        };

        Editor.prototype.fromJSON = function (json) {

            var loader = new THREE.ObjectLoader();


            // backwards

            if (json.stage == undefined) {

                var stage = loader.parse(json);

                this.setStage(stage);

                return;

            }

            // TODO: missing something.

            var camera = loader.parse(json.camera);

            this.camera.position.copy(camera.position);
            this.camera.rotation.copy(camera.rotation);
            this.camera.aspect = camera.aspect;
            this.camera.near = camera.near < 1 ? 4 : camera.near;
            this.camera.far = camera.far;

            if (json.camera.controlsCenter) {
                var controlsCenter = json.camera.controlsCenter;
                this.orbitControl.center.set(controlsCenter.x, controlsCenter.y, controlsCenter.z);
                this.orbitControl.update();
            }

            var gp = this.globalProperties;

            if (json.project.lightIntensity)gp.lightIntensity.setValue(json.project.lightIntensity);
            if (json.project.ambient)gp.ambient.setValue(json.project.ambient);
            if (json.project.shadowDarkness)gp.shadowDarkness.setValue(json.project.shadowDarkness);
            if (json.project.shadowBlur)gp.shadowBlur.setValue(json.project.shadowBlur);
            if (json.project.lightPosition)gp.lightPosition.setValue(json.project.lightPosition);
            if (json.project.lightRadius)gp.lightRadius.setValue(json.project.lightRadius);
            if (json.project.lightHeight)gp.lightHeight.setValue(json.project.lightHeight);

            this.setStage(loader.parse(json.stage));
            this.selectObject(this.stage.ground);
            this.scripts = json.scripts;

        };

        Editor.prototype.toJSON = function () {

            var controls = this.controls;
            var cameraJson = this.camera.toJSON();
            cameraJson.controlsCenter = this.orbitControl.center.clone();
            return {

                project: {
                    vr: false,
                    lightIntensity: controls.lightIntensity,
                    lightHeight: controls.lightHeight,
                    lightRadius: controls.lightRadius,
                    lightPosition: controls.lightPosition,
                    shadowDarkness: controls.shadowDarkness,
                    shadowBlur: controls.shadowBlur,
                    ambient: controls.ambient
                },
                camera: cameraJson,
                stage: this.stage.toJSON(),
                scripts: this.scripts

            };

        };

        Editor.prototype.openFile = function () {
            this.purchase();
        };

        Editor.prototype.saveFile = function () {
            this.purchase();
        };

        Editor.prototype.saveToFile = function () {
            var _this = this;
            var thumb = this.download(240, 160, true, function (blob) {
                var fileBlob = new Blob([blob, JSON.stringify(_this.toJSON())], {type: "image/jpg"});//"text/plain;charset=utf-8"});
                saveAs(fileBlob, "mockup.ms.jpg");
            });
        };
//Load a mockup file from the fileName
        Editor.prototype.loadFile = function (fileName) {
            var editor = this;

            //Load the file and get the JSON Data
            $.get(fileName + "?" + Math.random(), function (data) {
                if (data.stage == undef) {
                    data = editor.readFormat(data, fileName);
                }
                if (data !== undef) {
                    editor.reset();
                    editor.fromJSON(data);
                }

                //if (!deip.isExtension) {
                //    //editor.currentFileName = fileName.substr(fileName.lastIndexOf("/") + 1).replace(".json","");
                //    //editor.updateTitle();
                //}
            });

        };

        Editor.prototype.readFormat = function (data, fileName) {
            var projectData = "";
            //falback for older formats where they were just raw json
            if (data.indexOf('{"project":{') == 0) {
                return JSON.parse(data);
            }
            //new formats have image dat first and json data added to it.
            var projectDataIndex = data.indexOf('{"project":{');
            if (projectDataIndex > -1) {
                projectData = data.substr(projectDataIndex);
                return JSON.parse(projectData);
            }
            else {
                swal({
                    title: "Invalid File...",
                    text: "The selected file " + fileName + "is invalid or currupted.",
                    confirmButtonColor: editor.colors.red,
                    closeOnConfirm: true
                }, function (isConfirm) {
                    if (isConfirm) {

                    }
                });
                return undef;
            }
        };

        Editor.prototype.setStage = function (stage) {

            this.stage.uuid = stage.uuid;
            this.stage.name = stage.name;
            this.stage.userData = JSON.parse(JSON.stringify(stage.userData));

            while (stage.children.length > 0) {

                var object = stage.children[0];

                if (object instanceof MOCKUP.Ground) {
                    MOCKUP.clearChild(this.stage.ground);
                    object.widthScale = 1;
                    object.heightScale = 1;
                    object.scale.x = 1;
                    object.scale.y = 1;
                    this.stage.add(object);
                    this.stage.ground = object;
                }

                else if (object instanceof THREE.SpotLight || object instanceof THREE.AmbientLight || object instanceof THREE.PerspectiveCamera || object.type == "Object3D" || object instanceof THREE.CameraHelper) {
                    MOCKUP.clearChild(object);
                }

                else {
                    this.stage.add(object);
                    object.skipLoad = false;
                    if (object.cloneParent !== undef) {
                        var cloneParent = this.stage.getObjectByUuid(object.cloneParent);
                        if (cloneParent !== undef && cloneParent.type == object.type) {
                            object.material = cloneParent.material;
                        }
                    }
                }
            }
        };


        /*Other functions*/
        Editor.activate = function (selection, element, className) {
            if (!className) {
                className = "active";
            }
            if (selection) {
                $(selection).removeClass(className);
            }
            if (element) {
                $(element).addClass(className);
            }
        };

        Editor.prototype.createFileList = function (values, $container, itemClickCallback) {
            for (var key in values) {
                var value = values[key];
                var file = $('<li class="files"><a href="' + value + '" title="' + key + '" class="files" style="background-image:url(\'' + value + '?\')"><span class="name">' + key + '</span></a></li>');
                $container.append(file);
                file.on("click", function (e) {
                    if (itemClickCallback !== void 0) itemClickCallback(e, this);
                });
            }
        };
        return Editor;
    })({});
})
(MOCKUP || (MOCKUP = {}));

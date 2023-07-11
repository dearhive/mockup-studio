/**
 * Copyright 2015, Deepak Ghimire.  All rights reserved.
 */
"use strict";
var presets = {};

/**
 * Presets can be created based on the following template,
 * and will be available for addition through sharing in community
 */
MOCKUP.presets = {
    TriFold: {
        menu: {
            name: "TriFold",
            subMenu: {
                menua4: {name: "A4", options: {height: 210, width: 297}},
                menuus: {name: "US Letter", options: {height: 215.9, width: 279.4}, addSeperator: true},
                menua4x3: {name: "A4 x 3", options: {height: 297, width: 630}}
            },
            addSeperator: false
        },
        options: {
            defaultImage: [, , , , "images/textures/trifold-in.png", "images/textures/trifold-out.png"],
            frontBump: "images/textures/trifold-bump-in.png",
            folds: 3,
            width: 297,
            height: 210,
            angles: [, 15, , , 15,],
            position: {x: 0, y: 0.5, z: 0},
            rotation: {x: -90, y: 0, z: 0}
        },
        presets: {
            opensemi: {
                thumb: "images/presets/trifold/open1.jpg",
                objects: [{
                    angles: [, 150, , , 45,],
                    position: {x: 0, y: 2.5, z: 0},
                    rotation: {x: -90, y: 0, z: 0}
                }]
            },
            closed: {
                thumb: "images/presets/trifold/close1.jpg",
                objects: [{
                    angles: [, 179, , , 180,],
                    position: {x: 0, y: 4, z: 0},
                    rotation: {x: -90, y: 0, z: 0}
                }]
            },
            openFront: {
                thumb: "images/presets/trifold/open0.jpg",
                objects: [{
                    angles: [, 0, , , 0,],
                    position: {x: 0, y: 0.5, z: 0},
                    rotation: {x: -90, y: 0, z: 0}
                }]
            },
            open2: {
                thumb: "images/presets/trifold/open2.jpg",
                objects: [{
                    angles: [, 15, , , 15,],
                    position: {x: 0, y: 0.5, z: 0},
                    rotation: {x: -90, y: 0, z: 0}
                }]
            },
            closedBack: {
                thumb: "images/presets/trifold/close2.jpg",
                objects: [{
                    angles: [, 179, , , 180,],
                    position: {x: 0, y: 4, z: 0},
                    rotation: {x: -90, y: -180, z: 0}
                }]
            },
            openBack: {
                thumb: "images/presets/trifold/close3.jpg",
                objects: [{
                    angles: [, 0, , , 0,],
                    position: {x: 0, y: 2.5, z: 0},
                    rotation: {x: -90, y: -180, z: 0}
                }]
            }
        }
    },
    BiFold: {
        menu: {
            name: "BiFold",
            subMenu: {
                menua4: {name: "A4", options: {height: 210, width: 297}},
                menuus: {name: "US Letter", options: {height: 215.9, width: 279.4}},
                menudlx2: {
                    name: "DL Size",
                    options: {
                        height: 210,
                        width: 199,
                        defaultImage: [, , , , "images/textures/dlx2-in.png", "images/textures/dlx2-out.png"]
                    }
                },
                menua4square: {
                    name: "A4 Square",
                    options: {
                        height: 210,
                        width: 420,
                        defaultImage: [, , , , "images/textures/bifold-square-in.png", "images/textures/bifold-square-out.png"]
                    }
                }
            },
            addSeperator: true
        },
        options: {
            frontBump: "images/textures/bifold-inside-bump.jpg",
            folds: 2,
            width: 297,
            height: 210,
            defaultImage: [, , , , "images/textures/bifold-in.png", "images/textures/bifold-out.png"]
        },
        objects: [],
        presets: {
            opensemi: {
                thumb: "images/presets/bifold/open1.jpg",
                objects: [{
                    angles: [, 150, , , 0,],
                    position: {x: 0, y: 2.5, z: 0},
                    rotation: {x: -90, y: 0, z: 0}
                }]
            },
            closed: {
                thumb: "images/presets/bifold/close1.jpg",
                objects: [{
                    angles: [, 180, , , 0,],
                    position: {x: 0, y: 4, z: 0},
                    rotation: {x: -90, y: 0, z: 0}
                }]
            },
            openFront: {
                thumb: "images/presets/bifold/open0.jpg",
                objects: [{
                    angles: [, 0, , , 0,],
                    position: {x: 0, y: 0.5, z: 0},
                    rotation: {x: -90, y: 0, z: 0}
                }]
            },
            open2: {
                thumb: "images/presets/bifold/open2.jpg",
                objects: [{
                    angles: [, 15, , , 15,],
                    position: {x: 0, y: 0.5, z: 0},
                    rotation: {x: -90, y: 0, z: 0}
                }]
            },
            closedBack: {
                thumb: "images/presets/bifold/close2.jpg",
                objects: [{
                    angles: [, 0, , , 180,],
                    position: {x: 0, y: 4, z: 0},
                    rotation: {x: -90, y: 0, z: 0}
                }]
            },
            openBack: {
                thumb: "images/presets/bifold/close3.jpg",
                objects: [{
                    angles: [, 0, , , 0,],
                    position: {x: 0, y: 2.5, z: 0},
                    rotation: {x: -90, y: -180, z: 0}
                }]
            }
        }
    },
    BiFoldBook: {
        menus: {
            name: "BiFold",
            subMenu: {
                menua4: {name: "A4", options: {height: 210, width: 297}},
                menuus: {name: "US Letter", options: {height: 215.9, width: 279.4}},
                menudlx2: {
                    name: "DL Size",
                    options: {
                        height: 210,
                        width: 199,
                        defaultImage: [, , , , "images/textures/dlx2-in.png", "images/textures/dlx2-out.png"]
                    }
                },
                menua4square: {
                    name: "A4 Square",
                    options: {
                        height: 210,
                        width: 420,
                        defaultImage: [, , , , "images/textures/bifold-square-in.png", "images/textures/bifold-square-out.png"]
                    }
                }
            },
            addSeperator: true
        },
        options: {
            frontBump: "images/textures/bifold-inside-bump.jpg",
            folds: 2,
            width: 297,
            height: 210,
            defaultImage: [, , , , "images/textures/bifold-in.png", "images/textures/bifold-out.png"]
        },
        objects: [],
        presets: {
            opensemi: {
                thumb: "images/presets/bifold/open1.jpg",
                objects: [{
                    angles: [, 150, , , 0,],
                    position: {x: 0, y: 2.5, z: 0},
                    rotation: {x: -90, y: 0, z: 0}
                }]
            },
            closed: {
                thumb: "images/presets/bifold/close1.jpg",
                objects: [{
                    angles: [, 180, , , 0,],
                    position: {x: 0, y: 4, z: 0},
                    rotation: {x: -90, y: 0, z: 0}
                }]
            },
            openFront: {
                thumb: "images/presets/bifold/open0.jpg",
                objects: [{
                    angles: [, 0, , , 0,],
                    position: {x: 0, y: 0.5, z: 0},
                    rotation: {x: -90, y: 0, z: 0}
                }]
            },
            open2: {
                thumb: "images/presets/bifold/open2.jpg",
                objects: [{
                    angles: [, 15, , , 15,],
                    position: {x: 0, y: 0.5, z: 0},
                    rotation: {x: -90, y: 0, z: 0}
                }]
            },
            closedBack: {
                thumb: "images/presets/bifold/close2.jpg",
                objects: [{
                    angles: [, 0, , , 180,],
                    position: {x: 0, y: 4, z: 0},
                    rotation: {x: -90, y: 0, z: 0}
                }]
            },
            openBack: {
                thumb: "images/presets/bifold/close3.jpg",
                objects: [{
                    angles: [, 0, , , 0,],
                    position: {x: 0, y: 2.5, z: 0},
                    rotation: {x: -90, y: -180, z: 0}
                }]
            }
        }
    },

    Flyer: {
        options: {
            width: 297,
            height: 210,
            frontBump: "images/textures/bump.jpg",
            defaultImage: [, , , , "images/textures/A4-in.png", "images/textures/A4-out.png"]
        },
        menu: {
            name: "Flyer",
            subMenu: {
                menua4: {name: "A4", options: {width: 210, height: 297}},
                menua5: {
                    name: "A5", options: {width: 145, height: 210},
                    addSeperator: true
                },
                menua5land: {
                    name: "A5 Landscape",
                    options: {
                        segments: 30,
                        width: 210,
                        height: 145,
                        defaultImage: [, , , , "images/textures/A4-landscape-in.png", "images/textures/A4-landscape-out.png"]
                    },
                    addSeperator: true
                },
                menuus: {name: "US Letter", options: {width: 215.9, height: 279.4}},
                menudl: {
                    name: "DL",
                    options: {
                        width: 99,
                        height: 210,
                        defaultImage: [, , , , "images/textures/dl-in.png", "images/textures/dl-out.png"]
                    }
                }
            },
            addSeperator: true
        },
        presets: {
            openFront: {
                thumb: "images/presets/letterhead/open0.jpg",
                objects: [{
                    position: {x: 0, y: 0.5, z: 0},
                    rotation: {x: -90, y: 0, z: 0}
                }]
            },
            openBack: {
                thumb: "images/presets/letterhead/close3.jpg",
                objects: [{
                    position: {x: 0, y: 2.5, z: 0},
                    rotation: {x: -90, y: -180, z: 0}
                }]
            }
        }
    },
    BusinessCard: {
        options: {
            width: 297,
            height: 210,
            defaultImage: [, , , , "images/textures/A4-landscape-in.png", "images/textures/A4-landscape-out.png"]
        },
        menu: {
            name: "Business Card",
            subMenu: {
                menu1: {name: "85 x 55 mm", options: {height: 55, width: 85}},
                menu2: {name: "3.5 x 2 inch", options: {height: 50.8, width: 88.9}}
            },
            addSeperator: false
        },
        presets: {
            openFront: {
                thumb: "images/presets/businesscard/open0.jpg",
                objects: [{
                    position: {x: 0, y: 0.5, z: 0},
                    rotation: {x: -90, y: 0, z: 0}
                }]
            },
            openBack: {
                thumb: "images/presets/businesscard/close3.jpg",
                objects: [{
                    position: {x: 0, y: 2.5, z: 0},
                    rotation: {x: -90, y: -180, z: 0}
                }]
            }
        }
    },
    PaperStack: {
        options: {
            width: 297,
            height: 210,
            defaultImage: [, , , , "images/textures/A4-landscape-in.png", "images/textures/A4-landscape-out.png"]
        },
        menu: {
            name: "Paper Stack",
            subMenu: {
                menu1: {name: "85 x 55 mm", options: {height: 55, width: 85}},
                menu2: {name: "3.5 x 2 inch", options: {height: 50.8, width: 88.9}}
            },
            addSeperator: false
        },
        presets: {
            openFront: {
                thumb: "images/presets/businesscard/open0.jpg",
                objects: [{
                    position: {x: 0, y: 0.5, z: 0},
                    rotation: {x: -90, y: 0, z: 0}
                }]
            },
            openBack: {
                thumb: "images/presets/businesscard/close3.jpg",
                objects: [{
                    position: {x: 0, y: 2.5, z: 0},
                    rotation: {x: -90, y: -180, z: 0}
                }]
            }
        }
    },

    Magazine: {
        options: {
            width: 297,
            height: 210,
            defaultImage: [, , , , "images/textures/A4-landscape-in.png", "images/textures/A4-landscape-out.png"]
        },
        menu: {
            name: "Magazine",
            subMenu: {
                menua4: {name: "A4", options: {width: 210, height: 297}}
            },
            addSeperator: false
        },
        presets: {
            openFront: {
                thumb: "images/presets/businesscard/open0.jpg",
                objects: [{
                    position: {x: 0, y: 0.5, z: 0},
                    rotation: {x: -90, y: 0, z: 0}
                }]
            },
            openBack: {
                thumb: "images/presets/businesscard/close3.jpg",
                objects: [{
                    position: {x: 0, y: 2.5, z: 0},
                    rotation: {x: -90, y: -180, z: 0}
                }]
            }
        }
    },

    /*    LogoCard: {
     options: {
     width: 297,
     height: 210,
     defaultImage: [, , , , "images/textures/A4-landscape-grid-inside.jpg", "images/textures/A4-landscape-grid-outside.jpg"]
     },
     menu: {
     name: "Logo Card",
     subMenu: {
     menu1: {name: "85 x 55 mm", options: {height: 55, width: 85}},
     menu2: {name: "3.5 x 2 inch", options: {height: 50.8, width: 88.9}}
     },
     addSeperator: false
     },
     presets: {
     openFront: {
     thumb: "images/presets/businesscard/open0.jpg",
     objects: [{
     position: {x: 0, y: 0.5, z: 0},
     rotation: {x: -90, y: 0, z: 0}
     }]
     },
     openBack: {
     thumb: "images/presets/businesscard/close3.jpg",
     objects: [{
     position: {x: 0, y: 2.5, z: 0},
     rotation: {x: -90, y: -180, z: 0}
     }]
     }
     }
     },*/
    LetterHead: {
        options: {
            width: 297,
            height: 210,
            defaultImage: [, , , , "images/textures/A4-in.png", "images/textures/A4-out.png"]
        },
        menu: {
            name: "LetterHead",
            subMenu: {
                menua4: {name: "A4", options: {width: 210, height: 297}},
                menuus: {name: "US Letter", options: {width: 215.9, height: 279.4}}
            },
            addSeperator: true
        },
        presets: {
            openFront: {
                thumb: "images/presets/letterhead/open0.jpg",
                objects: [{
                    position: {x: 0, y: 0.5, z: 0},
                    rotation: {x: -90, y: 0, z: 0}
                }]
            },
            openBack: {
                thumb: "images/presets/letterhead/close3.jpg",
                objects: [{
                    position: {x: 0, y: 2.5, z: 0},
                    rotation: {x: -90, y: -180, z: 0}
                }]
            }
        }
    },
    UI: {
        options: {
            width: 72,
            height: 128,
            defaultImage: [, , , , "images/textures/A4-in.png", "images/textures/A4-out.png"]
        },
        menu: {
            name: "UI",
            subMenu: {
                menuiphone4: {
                    name: "Iphone 4/4s", options: {
                        screenSize: MOCKUP.inchTomm(3.5),
                        resolutionHeight: 960,
                        resolutionWidth: 640,
                        depth: 1
                    }
                },
                menu5inch169: {
                    name: "5 inch - 16:9", options: {
                        screenSize: MOCKUP.inchTomm(5),
                        resolutionHeight: 1920,
                        resolutionWidth: 1080,
                        depth: 1
                    }
                }
            },
            addSeperator: true
        },
        presets: {
            openFront: {
                thumb: "images/presets/ui/open0.jpg",
                objects: [{
                    position: {x: 0, y: 3, z: 0},
                    rotation: {x: -90, y: 0, z: 0}
                }]
            }
        }
    },
    Iphone: {
        options: {
            width: 72,
            height: 128,
            defaultImage: [, , , , "images/textures/A4-landscape-grid-inside.jpg", "images/textures/A4-landscape-grid-outside.jpg"]
        },
        menu: {
            name: "Devices",
            subMenu: {
                menu1: {
                    name: "Iphone 4/4s", options: {
                        modelPath: "images/presets/devices/iphone-5s-json/iphone-5s.json",
                        materialPath: "images/presets/devices/iphone-5s/iphone-5s.mtl",
                        width: 123.8
                    }
                }
            },
            addSeperator: false
        },
        presets: {
            openFront: {
                thumb: "images/presets/ui/open0.jpg",
                objects: [{
                    position: {x: 0, y: 3, z: 0},
                    rotation: {x: -90, y: 0, z: 0}
                }]
            }
        }
    },
    IphoneMat: {
        options: {
            width: 72,
            height: 128,
            defaultImage: [, , , , "images/textures/A4-landscape-grid-inside.jpg", "images/textures/A4-landscape-grid-outside.jpg"]
        },
        menu: {
            name: "DevicesMat",
            subMenu: {
                menu1: {
                    name: "Iphone 5s Mat", options: {
                        modelPath: "images/presets/devices/iphone-5s/iphone-5s.obj",
                        materialPath: "images/presets/devices/iphone-5s/iphone-5s.mtl",
                        width: 123.8
                    }
                }
            },
            addSeperator: false
        },
        presets: {
            openFront: {
                thumb: "images/presets/ui/open0.jpg",
                objects: [{
                    position: {x: 0, y: 3, z: 0},
                    rotation: {x: -90, y: 0, z: 0}
                }]
            }
        }
    },
    Ground: {
        options: {
            defaultImage: [, , , , "images/textures/ground-grid.png",]
        },
        presets: {
            openFront: {
                thumb: "images/presets/none/none.jpg",
                objects: [{}]
            }
        }
    },
    none: {
        options: {
            type: "none"
        },
        presets: {
            openFront: {
                thumb: "images/presets/none/none.jpg",
                objects: [{}]
            }
        }
    }
};

MOCKUP.Help = {
    subMenu: {
        menu1: {name: "Installation", url: "http://mockup.deipgroup.com/documentation/index.html#installation"},
        menu2: {name: "User Interface", url: "http://mockup.deipgroup.com/documentation/index.html#userInterface"},
        menu3: {name: "Interaction", url: "http://mockup.deipgroup.com/documentation/index.html#interaction"},
        menu4: {name: "Presets and Add New", url: "http://mockup.deipgroup.com/documentation/index.html#presets"},
        menu5: {
            name: "Global Properties",
            url: "http://mockup.deipgroup.com/documentation/index.html#globalProperties"
        },
        menu6: {
            name: "Object Properties",
            url: "http://mockup.deipgroup.com/documentation/index.html#objectProperties"
        },
        menu7: {name: "Get Image", url: "http://mockup.deipgroup.com/documentation/index.html#getImage"}
    }
};

MOCKUP.quickStart = {
    TriFold1: "data/templates/trifold/trifold1.ms.jpg",
    TriFold2: "data/templates/trifold/trifold3.ms.jpg",
    TriFold3: "data/templates/trifold/trifold4.ms.jpg",
    TriFold4: "data/templates/trifold/trifold5.ms.jpg",
    TriFold5: "data/templates/trifold/trifold6.ms.jpg",
    TriFold6: "data/templates/trifold/trifold7.ms.jpg",
    TriFold7: "data/templates/trifold/trifold8.ms.jpg",
    TriFold8: "data/templates/trifold/trifold.ms.jpg",
    TriFold9: "data/templates/trifold/trifold2.ms.jpg",

    UI1: "data/templates/ui/ui1.ms.jpg",
    UI2: "data/templates/ui/ui2.ms.jpg",
    UI3: "data/templates/ui/stack ui.ms.jpg",
    UI4: "data/templates/ui/ui-mobile-showcase.ms.jpg",
    UI5: "data/templates/ui/ui3.ms.jpg",
    UI6: "data/templates/ui/ui4.ms.jpg",
    UI7: "data/templates/ui/ui5.ms.jpg",
    UI8: "data/templates/ui/ui6.ms.jpg",
    UI9: "data/templates/ui/ui7.ms.jpg",
    UI10: "data/templates/ui/ui8.ms.jpg",
    UI11: "data/templates/ui/ui9.ms.jpg",

    BiFold: "data/bifold 5.ms.jpg",
    BiFold2: "data/bifold 6.ms.jpg",
    PostCard: "data/A5 postcard.ms.jpg",
    BusinessCard: "data/business card 3.ms.jpg",
    BusinessCard2: "data/business card 4.ms.jpg",
    BusinessCard3: "data/business card 1.ms.jpg",

    Options: "data/options.ms.jpg"
};
/**
 * Created the HTML UI into the editor
 * @param editor Editor object which will handle the presets
 * @constructor
 */
MOCKUP.LoadTypes = function (editor) {
    var mockupData = MOCKUP.presets;
    var $container = editor.container;
    if ($container.find(".nav").length == 0) {
        var preview_html = ""
                /*Menu list*/
            + "<div class='mockup-nav'>"
            + "<div class='nav-wrapper'>" + "<div class='nav-main'><div class='nav-main-wrapper'></div></div>"
            + "<div class='nav-sub'><div class='nav-sub-wrapper'></div></div>" + "</div>"
            + "<div class='nav-options'></div>"
            + "</div>";
        $container.append($(preview_html));
    }
    var menuContainer = $container.find(".nav-main-wrapper");
    var menuHtml = "";
    for (var key in mockupData) {
        if (key !== "options")
            menuHtml += "<div class='nav-item' data-class='" + key + "' data-type='" + key + "'>" + key + "</div>";
    }
    menuContainer.html(menuHtml);
    menuContainer.find(".nav-item").on("click", (function () {
        var type = $(this).data("class");

        var element = mockupData[type];

        var _menuContainer = $(this).closest(".nav-wrapper").find(".nav-sub-wrapper");
        var menuHtml = "";
        for (var key in element.presets) {
            menuHtml += "<div class='menu-item' data-class='" + type + "." + key + "' style='background-image:url("
            + element.presets[key].thumb + ")'></div>";
        }
        //menuHtml += "<div class='menu-item add-new'>Add New</div>";
        element.objects = [];

        _menuContainer.html(menuHtml);
        _menuContainer.find(".menu-item").on("click", (function () {
            //check presets
            var _type = $(this).data("class");
            if (_type !== void 0) {
                var parentType = _type.split(".")[0];
                if (parentType !== "none") {
                    var selfType = _type.split(".")[1];
                    var mockup = mockupData[parentType].presets[selfType];
                    var options = $.extend({}, mockupData.options, mockupData[parentType].options);
                    if (presets.addNew) {
                        mockupData[parentType].objects = [];
                        _menuContainer.find(".menu-item.add-new").click();
                    }
                    LoadMockupThree(options, mockup, mockupData[parentType], editor);
                }
            }
        }));
        _menuContainer.find(".menu-item.add-new").click(function () {
            presets.addNew = !presets.addNew;
            if (presets.addNew) $(this).addClass("active");
            else $(this).removeClass("active");
        });

        //_menuContainer.find(".menu-item:nth-child(1)").click();
    }));
    menuContainer.find(".nav-item:nth-child(1)").click();

};

/**
 * Loads mockups or updates existing mockup objects
 * @param options default options accumulated through hirarchy
 * @param mockup mockup option retained by parent
 * @param parent parent reference
 * @param editor the editor with which preset data is associated to.
 */
function LoadMockupThree(options, mockup, parent, editor) {

    options = $.extend({}, options, mockup.objects[0]);

    var page, isNew = false;

    //skip the if the default object in selectio is a Ground object
    if (editor.defaultObject !== (void 0) && editor.defaultObject.type == "Ground") return;
    page = (editor.defaultObject == void 0)
        ? editor.stage.getObjectById(parent.objects[0])
        : editor.defaultObject;
    //}

    editor.defaultObject = page;
    editor.selectObject(editor.defaultObject);

    //if object is a type of foldPaper it will need to update its fold angles
    if (options.angles && page.updateAngle !== void 0) {
        page.angles = options.angles;
        editor.skipPropertyUpdate = true;
        editor.objectProperties.foldAngle1.setValue(options.angles[1]);
        editor.objectProperties.foldAngle2.setValue(options.angles[4]);
        editor.skipPropertyUpdate = false;
        page.updateAngle();
    }

    updateState(page, options, isNew);
    editor.selected = null;
    editor.selectObject(editor.defaultObject);
}

/**
 * Updates State of mockup Element based on
 * @param  page mockup element derived from page
 * @param options options to be applied
 * @param isNew condition is the object is new to scene or just requires update
 */
function updateState(page, options, isNew) {
    if (options.position && isNew) {
        page.position.x = options.position.x;
        page.position.y = options.position.y;
        page.position.z = options.position.z;
    }
    if (options.rotation) {
        page.rotation.x = (MOCKUP.mode !== MOCKUP.MODE.PLUGIN ? options.rotation.x : options.rotation.x + 90) * Math.PI / 180;
        page.rotation.y = options.rotation.y * Math.PI / 180;
        page.rotation.z = options.rotation.z * Math.PI / 180;
    }
}


var editor;
$(document).ready(function () {
    //create editor on canvas using the presets
    editor = new MOCKUP.Editor($("#canvas_home")[0], MOCKUP.presets);

});
var mockupTips = ["Double Click on an element to change the design. <strong>It's just that easy!!</strong>",
    "Use <strong>Edit mode</strong> to change the mockup setup or to create a new one.",
    "Generate different size of mockups. Change it from options in <strong>Generate Mockup</strong> Button."
    ];
//MOCKUP.mode = MOCKUP.MODE.PLUGIN;
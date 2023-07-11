/**
 * @preserve Copyright 2016, Deepak Ghimire.  All rights reserved.
 */
"use strict";
var undef = undef || void 0;
MOCKUP.Editor.prototype.addAppExplorer = function () {

    var editor = this;
    var explorer = editor.explorer = {};
    explorer.fileEntry = null;
    explorer.accepts = [{
        extensions: ["json"]
    }];

    explorer.open = function () {

        chrome.fileSystem.chooseEntry({type: 'openFile', accepts: explorer.accepts}, function (theEntry) {
            if (!theEntry) {
                output.textContent = 'No file selected.';
                return;
            }
            if (theEntry.name.indexOf(".jpg") > 0) {
                theEntry.fileSystem.root.getFile(theEntry.fullPath.replace(".jpg", ".json"), {create: false}, function (jsonEntry) {
                    // use local storage to retain access to this file
                    chrome.storage.local.set({'chosenFile': chrome.fileSystem.retainEntry(jsonEntry)});
                    explorer.loadFile(jsonEntry);
                }, function () {
                    1 == 1;
                })
            }
            else if (theEntry.name.indexOf(".json") > 0) {
                // use local storage to retain access to this file
                chrome.storage.local.set({'chosenFile': chrome.fileSystem.retainEntry(theEntry)});
                explorer.loadFile(theEntry);
            }
        });
    };

    explorer.saveFile = function (fileName, data, callback, saveAs) {
        if (saveAs == true || (fileName.indexOf(editor.untitledFileName) > -1)) {

            var config = {
                type: 'saveFile',
                suggestedName: fileName.replace(".json", "") + ".json",
                accepts: editor.explorer.accepts
            };
            chrome.fileSystem.chooseEntry(config, function (writableEntry) {
                var blob = new Blob([JSON.stringify(data)], {type: 'text/plain'});
                editor.explorer.writeFileEntry(writableEntry, blob, function (e) {
                    callback(writableEntry.name);
                });
            });
        }
        else {
            var blob = new Blob([JSON.stringify(data)], {type: 'text/plain'});
            editor.explorer.writeFileEntry(editor.explorer.fileEntry, blob, function (e) {
                callback(fileName);
            });
        }
    };
    explorer.loadFile = function (_fileEntry) {
        explorer.fileEntry = _fileEntry;
        explorer.fileEntry.file(function (file) {
            readAsText(explorer.fileEntry, function (result) {
                result = JSON.parse(result);
                editor.reset();
                editor.fromJSON(result);
                editor.currentFileName = _fileEntry.name;
                editor.updateTitle();
            });
        });
    };

    explorer.writeFileEntry = function (writableEntry, opt_blob, callback) {
        if (!writableEntry) {
            //output.textContent = 'Nothing selected.';
            return;
        }

        writableEntry.createWriter(function (writer) {

            writer.onerror = MOCKUP.error;
            writer.onwriteend = callback;

            // If we have data, write it to the file. Otherwise, just use the file we
            // loaded.
            if (opt_blob) {
                writer.truncate(opt_blob.size);
                waitForIO(writer, function () {
                    writer.seek(0);
                    writer.write(opt_blob);
                });
            }
            else {
                explorer.fileEntry.file(function (file) {
                    writer.truncate(file.fileSize);
                    waitForIO(writer, function () {
                        writer.seek(0);
                        writer.write(file);
                    });
                });
            }
            explorer.fileEntry = writableEntry;
            editor.currentFileName = writableEntry.name;
            editor.updateTitle();
        }, MOCKUP.error);
    };

    function waitForIO(writer, callback) {
        // set a watchdog to avoid eventual locking:
        var start = Date.now();
        // wait for a few seconds
        var reentrant = function () {
            if (writer.readyState === writer.WRITING && Date.now() - start < 4000) {
                setTimeout(reentrant, 100);
                return;
            }
            if (writer.readyState === writer.WRITING) {
                console.error("Write operation taking too long, aborting!" +
                " (current writer readyState is " + writer.readyState + ")");
                writer.abort();
            }
            else {
                callback();
            }
        };
        setTimeout(reentrant, 100);
    }

    function readAsText(fileEntry, callback) {
        fileEntry.file(function (file) {
            var reader = new FileReader();

            reader.onerror = MOCKUP.error;
            reader.onload = function (e) {
                callback(e.target.result);
            };

            reader.readAsText(file);
        });
    }
};

MOCKUP.Editor.prototype.addBrowserExplorer = function () {
    var editor = this;
    var explorer = editor.explorer = $("<div class='explorer'></div>");
    var search, breadcrumbs, fileList, header, close, hiddenFileInput;

    header = $("<div class='explorer-title'><span>Click an object to select..</span></div>");
    close = $("<div class='explorer-close'>Cancel</div>");
    search = $("<div class='search'><input type='search' placeholder='Find a file..' /></div>");
    breadcrumbs = $("<div class='breadcrumbs'></div>");
    fileList = $("<ul class= 'data'></ul>");

    hiddenFileInput = $("<input type='file' class='hidden-input'>");
    explorer.append(hiddenFileInput);

    editor.container.append(explorer);
    explorer.append(header);
    header.append(close);
    explorer.append(search);
    explorer.append(breadcrumbs);
    explorer.append(fileList);

    explorer.append("<div class='nothingfound'><div class='nofiles'></div><span>No files here.</span></div>");


    var response = [],
        currentPath = '',
        fileData,
        breadcrumbsUrls = [];

    var folders = [],
        files = [];

    var random;

    explorer.init = function (responseData) {
        explorer.show();
        response = [responseData];
        fileData = responseData;
        breadcrumbsUrls = [];
        random = Math.random();
        currentPath = '';
        folders = [];
        files = [];
        goto("");
    };

    explorer.open = function (isServer) {
        if (isServer == true) {
            $.ajax({
                type: "post",
                url: "request.php",
                data: {command: "get_files"},
                success: function (data) {
                    explorer.init(data);
                },
                dataType: "json"
            });
        }
        else {
            hiddenFileInput.click();
        }
    };

    hiddenFileInput.change(function () {
        var files = hiddenFileInput[0].files;
        var file;
        if (files.length) {
            file = files[0];
            file.upload = {
                progress: 0,
                total: file.size,
                bytesSent: 0
            };

            var fileReader;
            fileReader = new FileReader;
            fileReader.onload = (function (file) {
                return function () {
                    hiddenFileInput.val("");
                    var data = fileReader.result;
                    if (data.stage == void 0) {
                        data = JSON.parse(data);
                    }
                    editor.reset();
                    editor.fromJSON(data);
                    editor.currentFileName = file.name;
                    editor.updateTitle();
                };
            })(file);
            fileReader.readAsText(file);

        }
    });
    function errorHandler(e) {
        var msg = '';

        switch (e.code) {
            case FileError.QUOTA_EXCEEDED_ERR:
                msg = 'QUOTA_EXCEEDED_ERR';
                break;
            case FileError.NOT_FOUND_ERR:
                msg = 'NOT_FOUND_ERR';
                break;
            case FileError.SECURITY_ERR:
                msg = 'SECURITY_ERR';
                break;
            case FileError.INVALID_MODIFICATION_ERR:
                msg = 'INVALID_MODIFICATION_ERR';
                break;
            case FileError.INVALID_STATE_ERR:
                msg = 'INVALID_STATE_ERR';
                break;
            default:
                msg = 'Unknown Error';
                break;
        }

        console.log('Error: ' + msg);
    }

    function onInitFs(fs) {

        console.log('Opened file system: ' + fs.name);

    }

    window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
    navigator.webkitPersistentStorage.requestQuota(1024 * 1024, function (grantedBytes) {
        window.requestFileSystem(PERSISTENT, grantedBytes, onInitFs, errorHandler);
    }, function (e) {
        console.log('Error', e);
    });

    explorer.saveFile = function (fileName, data, callback, saveAs) {

        var image = editor.download(240, 160, true);

        var savefile = function (filename) {
            var saveFile = filename.trim().indexOf("data/") == 0 ? filename : "data/save/" + filename;
            saveFile = saveFile.replace(".json", "");

            function dataURItoBlob(dataURI, callback) {
                // convert base64 to raw binary data held in a string
                // doesn't handle URLEncoded DataURIs
                var byteString = atob(dataURI.split(',')[1]);

                // separate out the mime component
                var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

                // write the bytes of the string to an ArrayBuffer
                var ab = new ArrayBuffer(byteString.length);
                var ia = new Uint8Array(ab);
                for (var i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                }

                /*                // write the ArrayBuffer to a blob, and you're done
                 var bb = new window.WebKitBlobBuilder(); // or just BlobBuilder() if not using Chrome
                 bb.append(ab);
                 return bb.getBlob(mimeString);*/

                return new Blob([ab], {type: mimeString});
            }


            window.requestFileSystem(window.PERSISTENT, 1024 * 1024, function (fs) {
                fs.root.getFile("image.txt", {create: true}, function (fileEntry) {
                    fileEntry.createWriter(function (fileWriter) {
                        //fileWriter.write(dataURItoBlob(image));
                        var blob = new Blob(['Lorem Ipsum'], {type: 'text/plain'});
                        fileWriter.onwriteend = function (e) {
                            console.log('Write completed.');
                        };

                        fileWriter.onerror = function (e) {
                            console.log('Write failed: ' + e.toString());
                        };
                        fileWriter.write(blob);
                    }, errorHandler);
                }, errorHandler);
            }, errorHandler);

            $.post("request.php", {
                command: "save_mockup",
                filename: saveFile,
                data: JSON.stringify(data),
                success: function () {
                    editor.currentFileName = saveFile;
                    editor.updateTitle();
                    swal({
                        title: "Saved!",
                        text: "Your file: " + saveFile + " is saved",
                        timer: 1000,
                        type: "success",
                        showConfirmButton: false
                    });
                },
                image: image
            }).done(function () {

            }).fail(function () {
                //swal.close();
            }).always(function () {
                //swal.close();
            });
        };

        if (saveAs == true || (fileName.indexOf(this.untitledFileName) > -1)) {
            swal({
                title: "Save File!",
                text: "Got any FileName in mind?",
                type: "input",
                showCancelButton: true,
                closeOnConfirm: false,
                imageUrl: image,
                animation: "slide-from-top",
                inputPlaceholder: fileName,
                showLoaderOnConfirm: true
            }, function (inputValue) {
                if (inputValue === false) return false;
                if (inputValue === "") {
                    swal.showInputError("You need to write something!");
                    return false;
                }
                savefile(inputValue);

            });
        }
        else {
            //fileName = fileName.split("/").slice(-1)[0].split(".")[0]
            savefile(fileName);
        }
    };

    close.on("click", function () {
        explorer.hide();
    });
    search.on("click", function () {

        var search = $(this);

        search.find('span').hide();
        search.find('input[type=search]').show().focus();

    });
    search.find('input').on('input', function (e) {

            folders = [];
            files = [];

            var value = this.value.trim();

            if (value.length) {
                explorer.addClass('searching');
                goto('search=' + value.trim());
            }
            else {
                explorer.removeClass('searching');
                goto(encodeURIComponent(currentPath));
            }

        }
    ).on('keyup', function (e) {

            var search = $(this);

            if (e.keyCode == 27) {

                search.trigger('focusout');

            }

        }
    ).on('focusout', function (e) {

            var search = $(this);

            if (!search.val().trim().length) {

                goto(encodeURIComponent(currentPath));
                search.hide();
                search.parent().find('span').show();

            }

        });

    fileList.on('click', 'li.folders', function (e) {
        e.preventDefault();

        var nextDir = $(this).find('a.folders').attr('href');

        if (explorer.hasClass('searching')) {

            // Building the breadcrumbs

            breadcrumbsUrls = generateBreadcrumbs(nextDir);

            explorer.removeClass('searching');
            explorer.find('input[type=search]').val('').hide();
            explorer.find('span').show();
        }
        else {
            breadcrumbsUrls.push(nextDir);
        }
        goto(encodeURIComponent(nextDir));
        currentPath = nextDir;
    });

    fileList.on('click', 'li.files', function (e) {
        e.preventDefault();

        var dataFile = $(this).find('a.files').attr('href');
        explorer.hide();
        editor.loadFile(dataFile);
    });

    breadcrumbs.on('click', 'a', function (e) {
        e.preventDefault();

        var index = breadcrumbs.find('a').index($(this)),
            nextDir = breadcrumbsUrls[index];

        breadcrumbsUrls.length = Number(index);
        goto(encodeURIComponent(nextDir));
    });

    // Navigates to the given hash (path)
    function goto(hash) {

        hash = decodeURIComponent(hash).slice(0).split('=');

        if (hash.length) {
            var rendered = '';

            // if hash has search in it

            if (hash[0] === 'search') {

                explorer.addClass('searching');
                rendered = searchData(response, hash[1].toLowerCase());

                if (rendered.length) {
                    currentPath = hash[0];
                    render(rendered);
                }
                else {
                    render(rendered);
                }

            }

            // if hash is some path

            else if (hash[0].trim().length) {

                rendered = searchByPath(hash[0]);

                if (rendered.length) {

                    currentPath = hash[0];
                    breadcrumbsUrls = generateBreadcrumbs(hash[0]);
                    render(rendered);

                }
                else {
                    currentPath = hash[0];
                    breadcrumbsUrls = generateBreadcrumbs(hash[0]);
                    render(rendered);
                }

            }

            // if there is no hash

            else {
                currentPath = fileData.path;
                breadcrumbsUrls.push(fileData.path);
                render(searchByPath(fileData.path));
            }
        }
    }

    // Splits a file path and turns it into clickable breadcrumbs

    function generateBreadcrumbs(nextDir) {
        var path = nextDir.split('/').slice(0);
        for (var i = 1; i < path.length; i++) {
            path[i] = path[i - 1] + '/' + path[i];
        }
        return path;
    }


    // Locates a file by path

    function searchByPath(dir) {
        var path = dir.split('/'),
            demo = response,
            flag = 0;

        for (var i = 0; i < path.length; i++) {
            for (var j = 0; j < demo.length; j++) {
                if (demo[j].name === path[i]) {
                    flag = 1;
                    demo = demo[j].items;
                    break;
                }
            }
        }

        demo = flag ? demo : [];
        return demo;
    }


    // Recursively search through the file tree

    function searchData(data, searchTerms) {

        data.forEach(function (d) {
            if (d.type === 'folder') {

                searchData(d.items, searchTerms);

                if (d.name.toLowerCase().match(searchTerms)) {
                    folders.push(d);
                }
            }
            else if (d.type === 'file') {
                if (d.name.toLowerCase().match(searchTerms)) {
                    files.push(d);
                }
            }
        });
        return {folders: folders, files: files};
    }


    // Render the HTML for the file manager

    function render(data) {

        var scannedFolders = [],
            scannedFiles = [];

        if (Array.isArray(data)) {

            data.forEach(function (d) {

                if (d.type === 'folder') {
                    scannedFolders.push(d);
                }
                else if (d.type === 'file') {
                    scannedFiles.push(d);
                }

            });

        }
        else if (typeof data === 'object') {

            scannedFolders = data.folders;
            scannedFiles = data.files;

        }


        // Empty the old result and make the new one

        fileList.empty().hide();

        if (!scannedFolders.length && !scannedFiles.length) {
            explorer.find('.nothingfound').show();
        }
        else {
            explorer.find('.nothingfound').hide();
        }

        if (scannedFolders.length) {

            scannedFolders.forEach(function (f) {

                var itemsLength = f.items.length,
                    name = escapeHTML(f.name),
                    icon = '<span class="icon folder"></span>';

                if (itemsLength) {
                    icon = '<span class="icon folder full"></span>';
                }

                if (itemsLength == 1) {
                    itemsLength += ' item';
                }
                else if (itemsLength > 1) {
                    itemsLength += ' items';
                }
                else {
                    itemsLength = 'Empty';
                }

                var folder = $('<li class="folders"><a href="' + f.path + '" title="' + f.path + '" class="folders">' + icon + '<span class="name">' + name + '</span> <span class="details">' + itemsLength + '</span></a></li>');
                folder.appendTo(fileList);
            });

        }

        if (scannedFiles.length) {

            scannedFiles.forEach(function (f) {

                var fileSize = bytesToSize(f.size),
                    name = escapeHTML(f.name),
                    fileType = name.split('.'),
                    icon = '<span class="icon file"></span>';

                fileType = fileType[fileType.length - 1];

                var file = $('<li class="files"><a href="' + f.path + '" title="' + f.path + '" class="files" style="background-image:url(\'' + f.path.replace("json", "jpg") + '?' + random + '\')">'
                + '<span class="name">' + name + '</span> <span class="details">' + fileSize + '</span></a></li>');
                file.appendTo(fileList);
            });

        }


        // Generate the breadcrumbs

        var url = '';

        if (explorer.hasClass('searching')) {

            url = '<span>Search results: </span>';
            fileList.removeClass('animated');

        }
        else {

            fileList.addClass('animated');

            breadcrumbsUrls.forEach(function (u, i) {

                var name = u.split('/');

                if (i !== breadcrumbsUrls.length - 1) {
                    url += '<a href="' + u + '"><span class="folderName">' + name[name.length - 1] + '</span></a> <span class="arrow">→</span> ';
                }
                else {
                    url += '<span class="folderName">' + name[name.length - 1] + '</span>';
                }

            });

        }

        breadcrumbs.text('').append(url);


        // Show the generated elements

        fileList.animate({'display': 'inline-block'});

    }


    // This function escapes special html characters in names

    function escapeHTML(text) {
        return text.replace(/\&/g, '&amp;').replace(/\</g, '&lt;').replace(/\>/g, '&gt;');
    }


    // Convert file sizes from bytes to human readable units

    function bytesToSize(bytes) {
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes == 0) return '0 Bytes';
        var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    }
};

MOCKUP.Editor.prototype.addExtensionExplorer = function () {
    //check if it is extension mode
    if(window.chrome ==void 0 || window.chrome.browserAction == void 0)
        return;

    var editor = this;
    var explorer = editor.explorer = $("<div class='explorer'></div>");
    var search, breadcrumbs, fileList, header, close, hiddenFileInput;

    header = $("<div class='explorer-title'><span>Click an object to select..</span></div>");
    close = $("<div class='explorer-close'>Cancel</div>");
    search = $("<div class='search'><input type='search' placeholder='Find a file..' /></div>");
    breadcrumbs = $("<div class='breadcrumbs'></div>");
    fileList = $("<ul class= 'data'></ul>");

    hiddenFileInput = $("<input type='file' class='hidden-input'>");
    explorer.append(hiddenFileInput);

    editor.container.append(explorer);
    explorer.append(header);
    header.append(close);
    explorer.append(search);
    explorer.append(breadcrumbs);
    explorer.append(fileList);

    explorer.append("<div class='nothingfound'><div class='nofiles'></div><span>No files here.</span></div>");

    var response = [],
        currentPath = '',
        fileData,
        breadcrumbsUrls = [];

    var folders = [],
        files = [],
        fileNameList = "";

    var random;

    MOCKUP.Editor.prototype.saveFile = function (saveAs) {
        var editor = this;
        if (editor.stage.hasChild() == true) {
            var data = this.toJSON();
            //var image = this.download(240, 160, true);
            var fileName = this.currentFileName;

            if (fileName.indexOf(editor.untitledFileName) == 0) saveAs = true;
            var showSaved = function (filename) {
                swal({
                    title: "Saved!",
                    text: "Your file: " + filename + " is saved",
                    timer: 1000,
                    type: "success",
                    showConfirmButton: false
                });
            };

            editor.explorer.saveFile(fileName, data, showSaved, saveAs);
            editor.autosave();
        }
        else {
            swal({
                title: "Stage is empty!",
                text: "Your Mockup Stage looks empty try adding some objects..",
                type: "info",
                showConfirmButton: true
            });
        }
    };


        MOCKUP.Editor.prototype.openFile = function (isServer) {
            this.explorer.open(isServer);
        };

    var addFile = function (mockup) {
        var file = $('<li class="files" id="' + mockup.id + '"  title="' + mockup.name + '"><a href="' + mockup.id + '"  title="' + mockup.name + '" class="files" style="background-image:url(\'' + mockup.image + '\')"><span class="name">' + mockup.name + '</span></a></li>');
        var del = $('<span class="delete"></span>');
        file.append(del);

        file.data("type", mockup.type);
        file.data("data", mockup.data);
        fileList.append(file);
        fileNameList += mockup.name + "]:[" + mockup.id + "]),([";
    };

    explorer.init = function (responseData) {
        //explorer.show();
        //response = [responseData];
        //fileData = responseData;
        breadcrumbsUrls = [];
        random = Math.random();
        currentPath = '';
        folders = [];
        files = [];
        fileNameList = "]),([";
        //goto("");

        var mockups = {};
        editor.db.mockups.where("type").equalsIgnoreCase("local").each(function (mockup) {
            mockups[mockup.id] = mockup;
        }).then(function () {
            for (var key in mockups) {
                var mockup = mockups[key];
                addFile(mockup);

            }
        }).catch(function (err) {
            console.error("Could not load local mockups from database: " + err.message);
        }).finally(function () {
            var a = "";
        });

    };

    explorer.open = function (loadLocal) {
        if (loadLocal == true) {
            /*$.ajax({
             type: "post",
             url: "request.php",
             data: {command: "get_files"},
             success: function (data) {
             explorer.init(data);
             },
             dataType: "json"
             });*/


            explorer.show();
        }
        else {
            hiddenFileInput.click();
        }
    };

    hiddenFileInput.change(function () {
        var files = hiddenFileInput[0].files;
        var file;
        if (files.length) {
            file = files[0];
            var fileName = file.name;
            file.upload = {
                progress: 0,
                total: file.size,
                bytesSent: 0
            };

            var fileReader;
            fileReader = new FileReader;
            fileReader.onload = (function (file) {
                return function () {
                    hiddenFileInput.val("");
                    var data = editor.readFormat( fileReader.result,fileName);
                    if (data.stage == void 0) {
                        data = JSON.parse(data);
                    }
                    if(data!==undef) {
                        editor.reset();
                        editor.fromJSON(data);
                    }
                    //editor.currentFileName = file.name;
                    //editor.updateTitle();
                };
            })(file);
            fileReader.readAsText(file);

        }
    });

    explorer.fileExists = function(fileName){
        return fileNameList.indexOf("]),([" + fileName + "]:[") > -1;
    };

    explorer.getFileId = function (fileName){
        var fileId = 0;
        if (explorer.fileExists(fileName)) {
            fileId = fileNameList.substr(fileNameList.lastIndexOf("]),([" + fileName + "]:[") + 1).split("]),([")[0].split("]:[")[1];
        }
        return fileId;
    };

    explorer.saveFile = function (fileName, data, callback, saveAs) {

        //get Thumb Image
        var image = editor.download(240, 160, true);

        var savefile = function (fileName) {
            var saveFile = fileName.trim();//.indexOf("data/") == 0 ? fileName : "data/save/" + fileName;
            saveFile = saveFile.replace(".json", "");
            var start = performance.now();
            var onsuccess = function (event) {

                console.log('[' + /\d\d\:\d\d\:\d\d/.exec(new Date())[0] + ']', 'Saved state to IndexedDB. ' + ( performance.now() - start ).toFixed(2) + 'ms');
                //console.log("saved");
                swal({
                    title: "Saved!",
                    text: "Your file: " + saveFile + " is saved",
                    timer: 1000,
                    imageUrl: image,
                    type: "success",
                    showConfirmButton: false
                });
                editor.currentFileName = saveFile;
                editor.updateTitle();
            };

            var fileExists = explorer.fileExists(saveFile);

            var fileId = explorer.fileExists(saveFile) ? explorer.getFileId(saveFile) : Math.floor(Date.now());

            var isUpdate = fileExists ;
                //? true
                //: false;

            console.log(isUpdate);

            if (isUpdate == true) {
                editor.db.mockups.where("id").equals(parseInt(fileId)).each(function (mockup) {
                    editor.db.mockups.update(
                        mockup, {image: image, data: data}
                    ).then(function () {
                            var file = $("#" + fileId)
                            file.data("data", data);
                            file.find("a").css("background-image", "url('" + image + "')");
                            onsuccess();
                        }).catch(function (err) {
                            console.error("Could not update mockup to database: " + err.message);
                        }).finally(function () {

                        });
                }).then(function () {

                }).catch(function (err) {
                    console.error("Could not update mockup to database: " + err.message);
                }).finally(function () {

                });
            }
            else {
                editor.db.mockups.put({
                    data: data,
                    name: saveFile,
                    image: image,
                    user: "-1",
                    type: "local",
                    username: "",
                    timestamp: fileId,
                    id: fileId
                }).then(function () {
                    onsuccess();
                    editor.db.mockups.where("id").equals(parseInt(fileId)).each(function (mockup) {
                        addFile(mockup);
                        fileNameList += mockup.name + "]:[" + mockup.id + "]),([";
                    }).then(function () {

                    }).catch(function (err) {
                        console.error("Could not save mockup to database: " + err.message);
                    }).finally(function () {

                    });
                }).catch(function (err) {
                    console.error("Could not save to database:" + err.message);
                }).finally(function () {
                    // Do what should be done next...
                });
            }

            //save to google drive
            //currently only updates
            if (editor.user && editor.user.file !== undef) {
                var file = editor.user.file;
                var fileMetaData  = {
                    id: file.id,
                    title: file.name,
                    thumbnail:{
                        image:
                            image.replace(/^data:image\/(png|jpg|jpeg|gif);base64,/, '').replace(/\//g,'_').replace(/\+/g,'-'),
                        mimeType: "image/png"
                    }
                };
                var DEFAULT_FIELDS = 'id,title,mimeType,userPermission,editable,copyable,shared,fileSize';
                var boundary = Math.random().toString(36).slice(2);
                var nl = "\r\n";
                var request = gapi.client.request({
                    path: '/upload/drive/v2/files/' + encodeURIComponent(file.id),
                    method: 'PUT',
                    params: {
                        uploadType: 'multipart',
                        fields: DEFAULT_FIELDS
                    },
                    headers: {
                        'Authorization': 'Bearer ' + editor.user.token,
                        'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
                    },
                    body: nl + "--" + boundary + nl +
                    "Content-Type: " + "application/json" +
                    nl + nl +
                    JSON.stringify(fileMetaData)
                    + nl +
                    "--" + boundary + nl +
                    "Content-Type: " + "application/json" + nl + nl +
                    JSON.stringify(data)
                    + nl + "--" + boundary + "--"
                }).then(function (response) {
                    swal.close();
                    var data = response.result;
                    //console.log("File saved:" + data);
                }, function (reason) {
                    swal.close();
                    console.log("Could not save file:" + reason);
                });
                swal({
                    title: "Saving data to Google Drive...",
                    text: "Saving : " + file.name,
                    showConfirmButton: false
                });
            }
        };

        if (saveAs == true || (fileName.indexOf(this.untitledFileName) > -1)) {
            swal({
                title: "Save File!",
                text: "Got any FileName in mind?",
                type: "input",
                showCancelButton: true,
                closeOnConfirm: false,
                imageUrl: image,
                animation: "slide-from-top",
                inputPlaceholder: fileName,
                showLoaderOnConfirm: true
            }, function (inputValue) {
                if (inputValue === false) return false;
                if (inputValue === "") {
                    swal.showInputError("You need to write something!");
                    return false;
                }
                if (explorer.fileExists(inputValue)) {
                    swal.showInputError("File already exists!!");
                    return false;
                }
                savefile(inputValue);
            });
        }
        else {
            //fileName = fileName.split("/").slice(-1)[0].split(".")[0]
            savefile(fileName);
        }
    };

    close.on("click", function () {
        explorer.hide();
    });
    search.on("click", function () {

        var search = $(this);

        search.find('span').hide();
        search.find('input[type=search]').show().focus();

    });
    search.find('input').on('input', function (e) {

            folders = [];
            files = [];

            var value = this.value.trim();

            if (value.length) {
                explorer.addClass('searching');
                goto('search=' + value.trim());
            }
            else {
                explorer.removeClass('searching');
                goto(encodeURIComponent(currentPath));
            }

        }
    ).on('keyup', function (e) {

            var search = $(this);

            if (e.keyCode == 27) {

                search.trigger('focusout');

            }

        }
    ).on('focusout', function (e) {

            var search = $(this);

            if (!search.val().trim().length) {

                goto(encodeURIComponent(currentPath));
                search.hide();
                search.parent().find('span').show();

            }

        });

    fileList.on('click', 'li.folders', function (e) {
        e.preventDefault();

        var nextDir = $(this).find('a.folders').attr('href');

        if (explorer.hasClass('searching')) {

            // Building the breadcrumbs

            breadcrumbsUrls = generateBreadcrumbs(nextDir);

            explorer.removeClass('searching');
            explorer.find('input[type=search]').val('').hide();
            explorer.find('span').show();
        }
        else {
            breadcrumbsUrls.push(nextDir);
        }
        goto(encodeURIComponent(nextDir));
        currentPath = nextDir;
    });

    fileList.on('click', 'li.files', function (e) {
        e.preventDefault();

        var data = $(this).data("data");//find('a.files').attr('href');
        if (data.stage == undef) {
            data = JSON.parse(data);
        }
        explorer.hide();
        editor.reset();
        editor.fromJSON(data);
        editor.currentFileName = $(this).attr("title");
        editor.updateTitle();


        //editor.loadFile(dataFile);
    });
    fileList.on('click', 'li.files .delete', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var link = $(this).siblings("a");
        var deleteId = link.attr("href");//find('a.files').attr('href');
        var deleteName = link.attr("title");
        swal({
            title: "Delete?",
            text: "Delete " + deleteName + " ?",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: editor.colors.red,
            confirmButtonText: "Delete it!",
            closeOnConfirm: true
        }, function (isConfirm) {
            if (isConfirm) {
                editor.db.mockups.where("id").equals(parseInt(deleteId)).delete().then(function (deleteCount) {
                    if (deleteCount > 0) {
                        console.log("Deleted: (" + deleteCount + ") : " + deleteName);
                        link.closest("li.files").remove();
                        fileNameList =  fileNameList.replace(deleteName + "]:[" + deleteId + "]),([","");
                    }
                }).catch(function (err) {
                    console.error("Could not delete mockup from database: " + err.message);
                }).finally(function () {

                });
            }
        });

        //editor.loadFile(dataFile);
    });

    breadcrumbs.on('click', 'a', function (e) {
        e.preventDefault();

        var index = breadcrumbs.find('a').index($(this)),
            nextDir = breadcrumbsUrls[index];

        breadcrumbsUrls.length = Number(index);
        goto(encodeURIComponent(nextDir));
    });

    // Navigates to the given hash (path)
    function goto(hash) {

        hash = decodeURIComponent(hash).slice(0).split('=');

        if (hash.length) {
            var rendered = '';

            // if hash has search in it

            if (hash[0] === 'search') {

                explorer.addClass('searching');
                rendered = searchData(response, hash[1].toLowerCase());

                if (rendered.length) {
                    currentPath = hash[0];
                    render(rendered);
                }
                else {
                    render(rendered);
                }

            }

            // if hash is some path

            else if (hash[0].trim().length) {

                rendered = searchByPath(hash[0]);

                if (rendered.length) {

                    currentPath = hash[0];
                    breadcrumbsUrls = generateBreadcrumbs(hash[0]);
                    render(rendered);

                }
                else {
                    currentPath = hash[0];
                    breadcrumbsUrls = generateBreadcrumbs(hash[0]);
                    render(rendered);
                }

            }

            // if there is no hash

            else {
                currentPath = fileData.path;
                breadcrumbsUrls.push(fileData.path);
                render(searchByPath(fileData.path));
            }
        }
    }

    // Splits a file path and turns it into clickable breadcrumbs

    function generateBreadcrumbs(nextDir) {
        var path = nextDir.split('/').slice(0);
        for (var i = 1; i < path.length; i++) {
            path[i] = path[i - 1] + '/' + path[i];
        }
        return path;
    }


    // Locates a file by path

    function searchByPath(dir) {
        var path = dir.split('/'),
            demo = response,
            flag = 0;

        for (var i = 0; i < path.length; i++) {
            for (var j = 0; j < demo.length; j++) {
                if (demo[j].name === path[i]) {
                    flag = 1;
                    demo = demo[j].items;
                    break;
                }
            }
        }

        demo = flag ? demo : [];
        return demo;
    }


    // Recursively search through the file tree

    function searchData(data, searchTerms) {

        data.forEach(function (d) {
            if (d.type === 'folder') {

                searchData(d.items, searchTerms);

                if (d.name.toLowerCase().match(searchTerms)) {
                    folders.push(d);
                }
            }
            else if (d.type === 'file') {
                if (d.name.toLowerCase().match(searchTerms)) {
                    files.push(d);
                }
            }
        });
        return {folders: folders, files: files};
    }


    // Render the HTML for the file manager

    function render(data) {

        var scannedFolders = [],
            scannedFiles = [];

        if (Array.isArray(data)) {

            data.forEach(function (d) {

                if (d.type === 'folder') {
                    scannedFolders.push(d);
                }
                else if (d.type === 'file') {
                    scannedFiles.push(d);
                }

            });

        }
        else if (typeof data === 'object') {

            scannedFolders = data.folders;
            scannedFiles = data.files;

        }


        // Empty the old result and make the new one

        fileList.empty().hide();

        if (!scannedFolders.length && !scannedFiles.length) {
            explorer.find('.nothingfound').show();
        }
        else {
            explorer.find('.nothingfound').hide();
        }

        if (scannedFolders.length) {

            scannedFolders.forEach(function (f) {

                var itemsLength = f.items.length,
                    name = escapeHTML(f.name),
                    icon = '<span class="icon folder"></span>';

                if (itemsLength) {
                    icon = '<span class="icon folder full"></span>';
                }

                if (itemsLength == 1) {
                    itemsLength += ' item';
                }
                else if (itemsLength > 1) {
                    itemsLength += ' items';
                }
                else {
                    itemsLength = 'Empty';
                }

                var folder = $('<li class="folders"><a href="' + f.path + '" title="' + f.path + '" class="folders">' + icon + '<span class="name">' + name + '</span> <span class="details">' + itemsLength + '</span></a></li>');
                folder.appendTo(fileList);
            });

        }

        if (scannedFiles.length) {

            scannedFiles.forEach(function (f) {

                var fileSize = bytesToSize(f.size),
                    name = escapeHTML(f.name),
                    fileType = name.split('.'),
                    icon = '<span class="icon file"></span>';

                fileType = fileType[fileType.length - 1];

                var file = $('<li class="files"><a href="' + f.path + '" title="' + f.path + '" class="files" style="background-image:url(\'' + f.path.replace("json", "jpg") + '?' + random + '\')">'
                + '<span class="name">' + name + '</span> <span class="details">' + fileSize + '</span></a></li>');
                file.appendTo(fileList);
            });

        }


        // Generate the breadcrumbs

        var url = '';

        if (explorer.hasClass('searching')) {

            url = '<span>Search results: </span>';
            fileList.removeClass('animated');

        }
        else {

            fileList.addClass('animated');

            breadcrumbsUrls.forEach(function (u, i) {

                var name = u.split('/');

                if (i !== breadcrumbsUrls.length - 1) {
                    url += '<a href="' + u + '"><span class="folderName">' + name[name.length - 1] + '</span></a> <span class="arrow">→</span> ';
                }
                else {
                    url += '<span class="folderName">' + name[name.length - 1] + '</span>';
                }

            });

        }

        breadcrumbs.text('').append(url);


        // Show the generated elements

        fileList.animate({'display': 'inline-block'});

    }


    // This function escapes special html characters in names

    function escapeHTML(text) {
        return text.replace(/\&/g, '&amp;').replace(/\</g, '&lt;').replace(/\>/g, '&gt;');
    }


    // Convert file sizes from bytes to human readable units

    function bytesToSize(bytes) {
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes == 0) return '0 Bytes';
        var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    }
};


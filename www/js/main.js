/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    mode: 'dpp',        // default
    enableMUD: false,
    onboardMsg: {},
    uiConfig: {},
    deviceAttributes: {},

    initialize: function() {
        // all other listeners should be added in onDeviceReady
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
     },

    // Device Ready fires when all of the Cordova plugins are loaded and ready
    onDeviceReady: function() {

        document.getElementById('messageContainer').addEventListener("click", this.resetScan);
        document.getElementById('logout').addEventListener("click", app.logout);
        document.getElementById('onboard-button').addEventListener("click", this.onboard);
        document.getElementById('cancel-button').addEventListener("click", this.cancel);
        document.addEventListener("resume", function(){
            // Check for an active session
            app.checkSession();
        }, false);


        $('#scanner .waiting').hide();
        $('#scanner .ready').show();
    
        AppPreferences.fetch("mode", function(ok, value){
            if (ok) {
                app.mode = value;
            }
            
            if (app.mode == 'idora') {
                app.configureIdora();
            }
            else {
                app.configureDPP();
            }
        });
        AppPreferences.fetch("enableMUD", function(ok, value){
            if (ok) {
                app.enableMUD = value;
            }
        });
    },

    configureDPP: function() {

        // UI

        // Behavior
        document.getElementById('scanner').addEventListener("click", app.scanDPP );

        AppPreferences.fetch("mud_server", function(ok, value){
            if (ok) {
                app.mudServer = value;
            }
        });

        AppPreferences.fetch("dpp_server", function(ok, value){
            if (ok) {
                app.serverAddress = value;

                // Get UI configuration.
                var url = app.serverAddress + "/portal/v1/dpp/config";

                function addDeviceClasses() {

                    // Add blank class (no selection)
                    $('#device-class').append($('<option>', {value: "", text: "(select class)"}));

                    $.each(app.uiConfig.deviceClasses, function (i, item) {
                        $('#device-class').append($('<option>', { 
                            value: item,
                            text: item
                        }));
                    });
                }

                function defaultDeviceClasses() {
                    app.uiConfig = {
                        "deviceClasses" : ["Medical", "Security", "Personal", "Generic", "Shared"]
                    };
                }

                try {
                    $.ajax({
                        type: 'GET',
                        url: url,
                        timeout: 3000,
                        error: function(jqxhr, status) {
                            defaultDeviceClasses();
                            addDeviceClasses();
                        },
                        success: function(message, status) {
                            console.log("config: "+message);
                            var config = JSON.parse(message);
                            if (config.deviceClasses != undefined) {
                                app.uiConfig = config;
                            }
                            else {
                                defaultDeviceClasses();
                            }
                            addDeviceClasses();
                        }
                    });        
                }
                catch(e) {
                    //app.serverFail(e);
                }
            }
        });
    },

    configureIdora: function() {

        // UI
        $('.app-container').addClass("idora")
        $(".app h1").html("Micronets IdOra");

        // Behavior
        document.getElementById('scanner').addEventListener("click", app.scanIdora );

        AppPreferences.fetch("idora_server", function(ok, value){
            if (ok) {
                app.serverAddress = value;
            }
        });
    },

    preScan: function() {
        $('#scanner').addClass('hidden');
        $('#loading').removeClass('hidden');

        // Clear DPP selections
        $('#device-name').val("");
        $('#device-class')[0].selectedIndex = 0;

        // Clear the http cache
        // Note: This doesn't seem to have any effect. There is a CacheClear on startup that does work.
        // Must be memory resident cacheing in play. (investigating..)
        window.CacheClear(function(){}, function(){});
    },

    postScan: function() {
        $('#loading').addClass('hidden');
        //alert("postScan: "+text);
    },

    processMUD: function(callback) {

        var url = app.mudServer + "/mud/v1/mud-file/";
        url += app.parseUriKey(app.dpp_uri, 'I');
        url += '/';
        url += app.parseUriKey(app.dpp_uri, 'K');

        try {
            $.ajax({
                type: 'GET',
                url: url,
                timeout: 3000,
                error: function(jqxhr, status) {
                    callback();
                },
                success: function(message, status) {
                    try {
                        var mud = message;
                        if (typeof message == 'string') {
                            mud = JSON.parse(message);
                        }
                        if (mud["ietf-mud:mud"] != undefined) {
                            var root = mud["ietf-mud:mud"];
                            app.setDeviceClass(root["ietf-mud-micronets:class-name"]);
                            app.setDeviceName(root["model-name"]);
                            app.setDeviceAttribute("type", root["ietf-mud-micronets:type-name"]);
                            app.setDeviceAttribute("modelUID", root["ietf-mud-micronets:model-uid"]);
                            app.setDeviceAttribute("model", root["model-name"]);
                            app.setDeviceAttribute("manufacturer", root["mfg-name"]);
                        }
                        callback();
                    }
                    catch(e) {
                        callback()
                    }
                }
            });        
        }
        catch(e) {
            //app.serverFail(e);
            callback();
        }
    },

    setDeviceAttribute: function(attr,value) {
        if (value) {
            app.deviceAttributes[attr] = value;
        }
    },

    setDeviceClass: function(className) {
        if (className) {
            app.selectClass(className);
        }
        else {
            app.selectClass("Generic");
        }
    },

    setDeviceName: function(modelName) {
        var deviceName = modelName;

        if (deviceName == undefined) {
            deviceName = "Device-"+Math.floor(Math.random() * 100000 % 1000);
        }

        $('#device-name').val(deviceName);

    },

    selectClass: function(className) {
        var exists = false;
        $('#device-class option').each(function(){
            if (this.value == className) {
                exists = true;
            }
        });
        if (!exists) {
            // Not in our list, don't break anything - just add it.
            $('#device-class').append($('<option>', {value: className, text: className}));
        }

        $('#device-class option[value='+className+']').prop('selected', true)
    },

    scanDPP: function(data) {
        app.preScan();

        cordova.plugins.barcodeScanner.scan(function(result){

            app.postScan();

            if (result.cancelled == 0) {
                app.dpp_uri = result.text;
                console.log("uri: "+app.dpp_uri);
                $('#mac').val(app.parseUriKey(app.dpp_uri, 'M').toUpperCase());
                if (app.enableMUD) {
                    $('#loading').removeClass('hidden');
                    app.processMUD(function(){
                        $('#loading').addClass('hidden');
                        $('#dpp-confirm').removeClass('hidden');
                    });
                }
                else {
                    app.setDeviceName();
                    $('#dpp-confirm').removeClass('hidden');
                }
            }
            else {
                $('#scanner').removeClass('hidden');
            }
        });
    },

    scanIdora: function(data) {
        app.preScan();

        cordova.plugins.barcodeScanner.scan(function(result){

            app.postScan();

            if (result.cancelled == 0) {
               $('#messageContainer').removeClass('hidden');
                $('#message-status').html("Login Submitted");
                $('#message-text').html("");               

            }
            else {
                $('#scanner').removeClass('hidden');
            }
        });
    },

    resetScan: function() {
        $('#scanner').removeClass('hidden');
        $('#messageContainer').addClass('hidden');
    },
    logout: function() {

        // TODO: Fix Idora Server to accept POST logout
        var type = 'POST';

        var url = app.serverAddress;
        if (app.mode == 'dpp') {
            url += '/portal/v1/dpp';
            //url += '/dpp';
        }
        else {
            type = 'GET';
        } 
        url += "/logout";

        try {
            $.ajax({
                type: type,
                url: url,
                timeout: 3000,
                crossDomain: true,
                xhrFields: { withCredentials: true },
                error: function(jqxhr, status) {
                    //app.serverFail(status);
                },
                success: function() {
                }
            });        
        }
        catch(e) {
            //app.serverFail(e);
        }
        //location.href = "login.html";
        // Start over, avoid login screen when using onboard-proxy (will call /session which will always return 200)
        // Will show splash again, NBD
        location.href = "index.html";
    },
    checkSession: function() {
        var url = app.serverAddress;
        if (app.mode == 'dpp') {
            url += '/portal/v1/dpp';
            //url += '/dpp';
        } 
        //url += "/checksession";
        url += "/session";

        try {
            $.ajax({
                type: "POST",
                url: url,
                timeout: 3000,
                xhrFields: { withCredentials: true },

                statusCode: {
                    401:function() { 
                        location.href = "login.html";
                    }
                },
                error: function(jqxhr, status) {
                    location.href = "login.html";
                }
            });        
        }
        catch(e) {
            location.href = "login.html";
        }
    },
    onboard: function() {

        var deviceClass = $('#device-class').val();

        if (deviceClass == "" || deviceClass.indexOf("No Micronets") == 0) {
            alert("No Device Class Selected");
            return;
        }

        app.onboardMsg = app.generateOnboardMsg(app.dpp_uri);

        console.log(JSON.stringify(app.onboardMsg, null, 4));

        $('#loading').removeClass('hidden');
        $('#dpp-confirm').addClass('hidden');


        var url = app.serverAddress + '/portal/v1/dpp/onboard'

        try {
            var request = $.ajax({
                type: "POST",
                url: url,
                contentType: "application/json",
                data : JSON.stringify(app.onboardMsg),
                crossDomain: true,
                xhrFields: { withCredentials: true },
                timeout: 10000,
                statusCode: {
                    401:function() { 
                        alert("login failed");
                    }
                },
                error: function(jqxhr, status, message) {
                    alert("status"+status+"\nmessage"+message);
                    app.onboardComplete(status, message);
                },
                success: function(message, status) {
                    app.onboardComplete("", "Onboard Submitted");
                }
            });        
        }
        catch(e) {
            alert("server failure - catch: "+e);
        }
    },
    cancel: function() {
        $('#scanner').removeClass('hidden');
        $('#loading').addClass('hidden');
        $('#dpp-confirm').addClass('hidden');

    },
    onboardComplete(status, message) {
        $('#scanner').addClass('hidden');
        $('#loading').addClass('hidden');
        $('#loading').addClass('hidden');
        $('#messageContainer').removeClass('hidden');
        $('#message-text').html('Onboard Submitted');

        if (status == "success") {
            // ajax success, look deeper
            var msg = JSON.parse(message);
            if( msg.message.messageType == "EVENT:DPP:DPPOnboardingCompleteEvent" ) {
                $('#message-status').html("Device Onboarded");
                $('#message-text').html(msg.message.messageBody.DPPOnboardingCompleteEvent.macAddress);
            }
            else if (msg.message.messageType == "EVENT:DPP:DPPOnboardingFailedEvent" ) {
                $('#message-status').html("Onboard Failed");
                $('#message-text').html(msg.message.messageBody.DPPOnboardingFailedEvent.reason);               
            }
            else {
                $('#message-status').html("Unknown Onboard Status");
                $('#message-text').html(msg.message.messageType);
            }
        }
        else {
            // ajax failure
            $('#message-status').html(status);
            $('#message-text').html(message);
        }
    },
    generateOnboardMsg: function(uri) {
        var msg = {};
        msg.bootstrap = {};
        msg.bootstrap.uri = uri;
        msg.bootstrap.mac = app.parseUriKey(uri, 'M').toUpperCase();
        msg.bootstrap.pubkey = app.parseUriKey(uri, 'K');
        msg.bootstrap.vendor = app.parseUriKey(uri, 'I');
        msg.user = {};
        msg.user.deviceRole = $('#mode-sta').prop('checked') ? 'sta' : 'ap';
        msg.user.deviceName = $('#device-name').val();
        msg.device = {};
        msg.device.class = $('#device-class').val();
        msg.device.type = app.deviceAttributes.type;
        msg.device.model = app.deviceAttributes.model;
        msg.device.modelUID = app.deviceAttributes.modelUID;
        msg.device.manufacturer = app.deviceAttributes.manufacturer;

        return msg;
    },
    parseUriKey: function(uri, key) {
        tokens = uri.split(';');
        for (const token of tokens) {
            if (token[0] == key) {
                return token.substring(2);
            }
        }
        return "";
    }
};

app.initialize();
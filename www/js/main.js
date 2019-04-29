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
    onboardMsg: {},

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
    },

    configureDPP: function() {

        // UI

        // Behavior
        document.getElementById('scanner').addEventListener("click", app.scanDPP );

        AppPreferences.fetch("dpp_server", function(ok, value){
            if (ok) {
                app.serverAddress = value;
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
    },

    postScan: function() {
        $('#loading').addClass('hidden');
        //alert("postScan: "+text);
    },

    scanDPP: function(data) {
        app.preScan();

        cordova.plugins.barcodeScanner.scan(function(result){

            app.postScan();

            if (result.cancelled == 0) {
               $('#dpp-confirm').removeClass('hidden');
               app.onboardMsg = app.generateOnboardMsg(result.text);
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
            //url += '/portal/v1/dpp';
            url += '/dpp';
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
        location.href = "login.html";


    },
    checkSession: function() {
        var url = app.serverAddress;
        if (app.mode == 'dpp') {
            //url += '/portal/v1/dpp';
            url += '/dpp';
        } 
        url += "/checksession";

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
                    app.onboardComplete(status, message);
                },
                success: function(message, status) {
                    app.onboardComplete(status, message);
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
            $('#message-text').html(msgBody);
        }
    },
    generateOnboardMsg: function(uri) {
        var msg = {};
        msg.uri = uri;
        msg.mac = app.parseUriKey(uri, 'M');
        msg.pubkey = app.parseUriKey(uri, 'K');
        msg.vendor = app.parseUriKey(uri, 'I');
        msg.role = $('toggle-btn').hasClass('checked') ? 'ap' : 'sta';

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
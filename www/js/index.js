/*
 * index.js
 * Landing page for the Micronets app. 
 * - splash screen, checksession POST to server
 * - on splash complete, if checksession succeeds, open main.html, else login.html
 * - except if server not available, display error and periodically retry.
 */

var app = {
    // Application Constructor
    mode: 'dpp',        // default
    progress: 0,
    next: undefined,

    initialize: function() {
        // all other listeners should be added in onDeviceReady
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
     },

    // Device Ready fires when all of the Cordova plugins are loaded and ready
    onDeviceReady: function() {

        app.startSplash();

        AppPreferences.fetch("debug", function(ok, value){
            if (ok) {
                app.debug = value;
            }
        });


        AppPreferences.fetch("mode", function(ok, value){
            if (ok) {
                app.mode = value;
            }
            
            if (app.mode == 'idora') {
                AppPreferences.fetch("idora_server", function(ok, value){
                    if (ok) {
                        app.serverAddress = value;
                        app.checkSession();
                    }
                });
            }
            else {
                AppPreferences.fetch("dpp_server", function(ok, value){
                    if (ok) {
                        app.serverAddress = value;
                        app.checkSession();
                    }
                });
            }
        });
    },

    startSplash: function() {

        if (app.debug) {
            app.animateSplash(20, 20, 50, 20, 20);
        }
        else {
            app.animateSplash(2000, 2000, 500, 500, 1000);
        }
    },

    animateSplash: function(title_duration, credit_duration, progress_delay, credit_delay, title_delay) {
        setTimeout(function(){
            // splash is active. fade in title, etc.
            $('#splash-title').fadeIn({"duration": title_duration, "done": function(){
                //alert("fadeIn done");
                setTimeout(function(){
                    $('#splash-credit').fadeIn({"duration": credit_duration, "done": function(){
                        setTimeout(function() {
                            app.showProgress();
                        },progress_delay);
                    }});
                }, credit_delay);
            }});
        }, title_delay);        
    },

    showProgress: function() {

        var limit = app.debug ? 20 : 100;
        $('#progress-bar span').css('width', '0%');
        $('#progress-bar').show();
        app.progress = 0;
        var timer = setInterval(function(){

            if (app.progress >= limit) {
                clearInterval(timer);
                $('#progress-bar').hide();

                if (app.next) {
                    location.href = app.next;
                }
                else {
                    app.serverRetry();
                }
            }
            else {
                app.progress += 4;
                $('#progress-bar span').css('width', ''+app.progress+'%');
            }

        },100);
    },

    checkSession: function() {

        if (app.debug) {
            location.href = 'main.html';
            return;
        }
        var type = "POST";

        var url = app.serverAddress;
        if (app.mode == 'dpp') {
            //url += '/portal/v1/dpp';
            url += '/dpp';
        }
        else {
            // TODO: Idora Server should use POST for checksession. Fix that when you get Artifactory credentials
            type = "GET";
        } 
        url += "/checksession";

        try {
            $.ajax({
                type: type,
                url: url,
                timeout: 3000,
                xhrFields: { withCredentials: true },

                statusCode: {
                    401:function() { 
                        app.next = 'login.html';
                    },
                    200:function() { 
                        app.next = 'main.html'; 
                    },
                    0:function() { 
                        app.serverFail(0); 
                    }
                },
                error: function(jqxhr, status) {
                    app.serverFail(status);
                }
            });        
        }
        catch(e) {
            app.serverFail(e);
        }
    },

    serverFail: function(status) {
        console.log("serverFail: "+status);
        app.next = undefined;
    },

    // After progress bar completes, if app.next is undefined, retry the whole thing.
    serverRetry: function() {
        $('#server-fail').show();
        setTimeout(function(){
            $('#server-fail').hide();
            app.checkSession();
            app.showProgress();
        }, 10000);
    }
};

app.initialize();
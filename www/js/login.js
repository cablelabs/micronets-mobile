
var login = {
    mode: 'dpp',        // default

    initialize: function() {
        // all other listeners should be added in onDeviceReady
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
        document.getElementById('settings-icon').onclick = login.showSettings;
    },
    showSettings: function() {
        AppPreferences.show();
    },


    // Device Ready fires when all of the Cordova plugins are loaded and ready
    onDeviceReady: function() {

		$( "#login-form" ).submit(function( event ) {
		  	//alert( "Handler for .submit() called." );
	        var url = login.serverAddress;
	        if (login.mode == 'dpp') {
	            url += '/portal/v1/dpp';
	            //url += '/dpp';
	        } 
	        url += "/login";

			var data = {
				username: $( "input[name=username]" ).val(),
				password: $( "input[name=password]" ).val()
			}

	        try {
	            var request = $.ajax({
	                type: "POST",
	                url: url,
                	//dataType : 'json', // data type
                	contentType: "application/json",
                	data : JSON.stringify(data),
                	crossDomain: true,
     				xhrFields: { withCredentials: true },
	                timeout: 3000,
	                statusCode: {
	                    401:function() { 
	                        alert("login failed");
	                    }
	                    /*,
	                    201:function() { 
	                        location.href = 'main.html'; 
	                    },
	                    0:function() { 
	                        alert("server failure (0)"); 
	                    }
	                    */
	                },
	                error: function(jqxhr, status) {
	                    //alert("server failure - error: "+ status);
	                    if (jqxhr.status == 404) {
	                    	// This needs to be fixed in portal if wrong user/pass. Fix message in the meantime..
	                    	alert("login failed");
	                    }
	                    else {
	                    	alert("login error: "+jqxhr.status);
	                    }
	                },
	                success: function() {
	                	//console.log( request.getAllResponseHeaders());
	                	//login.checkSession();
	                	location.href = "main.html";
	                }
	            });        
	        }
	        catch(e) {
	            alert("server failure - catch: "+e);
	        }
		  	event.preventDefault();
		});

	    AppPreferences.fetch("mode", function(ok, value) {
	    	if (ok) {
	    		login.mode = value;
				if (value == 'idora') {
		    		$(".login").addClass("login-idora")
		    		$("#form-label").html("Micronets IdOra");

	                AppPreferences.fetch("idora_server", function(ok, value){
	                    if (ok) {
	                        login.serverAddress = value;
	                    }
	                });
		    	}
		    	else {
	                AppPreferences.fetch("dpp_server", function(ok, value){
	                    if (ok) {
	                        login.serverAddress = value;
	                    }
	                });
		    	}
		    }
	    	else {
	    		alert("failed to fetch mode preference");
    		}	 
	    });
    }
};

login.initialize();





var AppPreferences = (function() {

    var obj = {};

    obj.fetch = function(key, callback) {

   		prefs = window.plugins.appPreferences;

   		prefs.fetch( 
   			function(value){
   				// Ok
   				callback(true, value);
   			}, 
   			function(error){
   				// fail
   				callback(false, error);
   			},
   			key );
    };

    // TODO: store, watch

    return obj;
}());

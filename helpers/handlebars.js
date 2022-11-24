var register = function(Handlebars) {
    var helpers = {
        check:function(){
            return "hello"
        }
};

if (Handlebars && typeof Handlebars.registerHelper === "function") {
    for (var prop in helpers) {
        Handlebars.registerHelper(prop, helpers[prop]);
    }
} else {
    return helpers;
}

};


module.exports.register = register;
module.exports.helpers = register(null); 
   
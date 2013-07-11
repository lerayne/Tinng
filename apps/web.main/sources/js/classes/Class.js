/**
 * Created with JetBrains PhpStorm.
 * User: Michael Yegorov
 * Date: 7/11/12
 * Time: 2:48 PM
 * To change this template use File | Settings | File Templates.
 */

// Конструтор классов, спасибо Riim (javascript.ru)

extend = Object.extend = function (self, obj) {
	if (self == null) self = {};
	for (var key in obj) self[key] = obj[key];
	return self;
}

var Class = function (parent, declaration) {

        var Klass = function () {
            this.initialize.apply(this, arguments);
        }

        if (typeof parent == 'function') {
            function F(){}

            F.prototype = parent.prototype;
            Klass.prototype = new F();
        } else {
            if (parent != null) declaration = parent;
            parent = Object;
        }

        extend(Klass.prototype, declaration).initialize || (Klass.prototype.initialize = Function.blank);
        Klass.superclass = parent;
        Klass.prototype.superclass = parent.prototype;
		Klass.prototype.constructor = Klass;
        return Klass;
};

// кроссбразузерность для bind

if (!Function.prototype.bind) {
	Function.prototype.bind = function (oThis) {
		if (typeof this !== "function") {
			// closest thing possible to the ECMAScript 5 internal IsCallable function
			throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
		}

		var aArgs = Array.prototype.slice.call(arguments, 1),
			fToBind = this,
			fNOP = function () {},
			fBound = function () {
				return fToBind.apply(this instanceof fNOP && oThis ? this : oThis,
					aArgs.concat(Array.prototype.slice.call(arguments))
				);
			};

		fNOP.prototype = this.prototype;
		fBound.prototype = new fNOP();

		return fBound;
	};
}
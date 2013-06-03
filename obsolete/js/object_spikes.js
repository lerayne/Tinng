/* набор универсальных функций с попыткой использовать ООП */

Address = function (delimSign, eqSign) {

	this.vars = {};
	this.delimSign = delimSign;
	this.eqSign = eqSign;

	this.load();

}

Address.prototype = {

	load:function () {
		var pairs = this.loadParams(), pair, varName, value;

		if (pairs.length) for (var i in pairs) {
			pair = pairs[i].split(this.eqSign);
			varName = pair[0];
			value = pair[1];
			if (varName !== '') this.vars[varName] = value;
		}
	},

	write: function (args) {

		if (args && args.length == 1 && typeof args[0] == 'object') for (var key in args[0]) this.vars[key] = args[0][key];
		if (args && args.length == 2 && typeof args[0] == 'string') this.vars[args[0]] = args[1];

		var newHash = [];
		for (var key in this.vars) newHash.push(key + this.eqSign + this.vars[key]);
		location.hash = newHash.join(this.delimSign);
	},

	loadParams:function () {
		if (location.hash.length > 2 && location.hash.indexOf(this.eqSign) != -1) {
			return location.hash.replace('#', '').split(this.delimSign);
		} else return [];
	},

	set:function () {
		this.write(arguments);
	},

	get:function (varName) {
		return (this.vars[varName]) ? this.vars[varName] : false;
	},

	del:function (varName) {
		delete(this.vars[varName]);
		this.write();
	}
}

adress = new Address(';', ':');
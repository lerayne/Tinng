/* набор универсальных функций с попыткой использовать ООП */

function LocHash(){
	this.hash = location.hash;

	var loadHash = function(){
		return location.hash.replace('#','').split(';');
	}

	this.set = function(varName, value){
		
		var newhash = [];
		var set;

		if (location.hash.indexOf(':') != -1){
			var pairs = loadHash();
			var pair;
			for (var i in pairs){
				pair = pairs[i].split(':');
				if (varName == pair[0]){
					pair[1] = value;
					set = true;
				}
				newhash[i] = pair[0]+':'+pair[1];
			}
		}
		if (!set) newhash[newhash.length] = varName+':'+value;
		location.hash = newhash.join(';');
	}

	this.get = function(varName){
		var pairs = loadHash();
		var pair;
		for (var i in pairs){
			pair = pairs[i].split(':');
			if (varName == pair[0]) return pair[1];
		}
		return false;
	}

	this.del = function(varName){
		var pairs = loadHash();
		var newhash = [];
		var pair;
		for (var i in pairs){
			pair = pairs[i].split(':');
			if (varName != pair[0]){
				newhash[i] = pair[0]+':'+pair[1];
			}
		}
		location.hash = newhash.join(';');
	}
}

adress = new LocHash;
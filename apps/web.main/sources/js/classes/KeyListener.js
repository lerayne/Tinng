/**
 * Created with JetBrains PhpStorm.
 * User: M. Yegorov
 * Date: 7/24/13
 * Time: 3:28 PM
 * To change this template use File | Settings | File Templates.
 */

tinng.protos.KeyListener = function(){
	tinng.funcs.bind(this);

	this.modifiers = {
		alt:false,
		ctrl:false,
		shift:false
	}

	this.keys = {
		'backspace':8,
		'tab':9,
		'ctrl+enter':10,
		'ctrlenter':10,
		'ctrl_enter':10,
		'enter':13,
		'pause':19,
		'break':19,
		'caps':20,
		'capsLock':20,
		'caps_lock':20,
		'capslock':20,
		'esc':27,
		'escape':27
	}

	this.modKeys = {
		'shift':16,
		'ctrl':17,
		'control':17,
		'alt':18
	}

	this.window = $(window);

	this.window.keydown(this.addModifier);
	this.window.keyup(this.removeModifier);
}

tinng.protos.KeyListener.prototype = {

	// todo - эта структура не имеет смысла, т.к. не работает зажатие двух и более модификаторов. Проработать.
	addModifier:function(e){
		if (e.keyCode == this.modKeys.alt) this.modifiers.alt = true;
		if (e.keyCode == this.modKeys.ctrl) this.modifiers.ctrl = true;
		if (e.keyCode == this.modKeys.shift) this.modifiers.shift = true;
	},

	removeModifier:function(e){
		if (e.keyCode == this.modKeys.alt) this.modifiers.alt = false;
		if (e.keyCode == this.modKeys.ctrl) this.modifiers.ctrl = false;
		if (e.keyCode == this.modKeys.shift) this.modifiers.shift = false;
	},

	// todo - в данный момент эта функция навешивает на каждое нажатие по событию на несчастный window :)
	// переделать так, чтобы keypress был всего один - в конце при активации листенера (метод activate)
	register:function(){
		var that = this;

		var combination = arguments[0].toLowerCase();
		var context = arguments[1];
		var callback = arguments[2];

		// все последующие аргументы передаются в коллбек-функцию, как аргументы
		var callbackArgs = [];
		for (var i = 3; i < arguments.length; i++) {
			callbackArgs[i-3] = arguments[i];
		}

		// если подана простая кнопка
		if (this.keys[combination] && this.keys[combination] != 10) {

			this.window.keypress(function(e){
				if (e.keyCode == that.keys[combination]) callback.apply(context, callbackArgs)
			});

		} else {
		// если подана комбинация

			var error = false;

			//дробим
			var keys = combination.split('+');

			//отделяем последнюю и проверяем есть ли такая кнопка
			var actionKey = keys.pop();
			if (typeof this.keys[actionKey] == 'undefined') error = 'key combination fails: action key "'+ actionKey +'" is not available';

			// проверяем, есть ли такие модификаторы
			keys.forEach(function(modifier){
				if (typeof that.modKeys[modifier] == 'undefined') error = 'key combination fails: modifier "'+ modifier +'" is not available';
			});

			if (error) console.log(error);
			else {
			// если нет ошибки:

				this.window.keypress(function(e){
					// для начала проверяем, та ли хоть рабочая клавиша нажата?
					if (e.keyCode == 10) e.keyCode = 13;
					if (e.keyCode == that.keys[actionKey]) {

						var allModifiersPressed = true;

						for (var mod in that.modifiers){

							//console.log(mod, that.modifiers, keys)

							// нет ли клавиш, которые должны быть зажаты, а не зажаты?
							if (!that.modifiers[mod] && keys.indexOf(mod) != -1) allModifiersPressed = false;

							// нет ли клавиш, которые не должны быть зажаты, а зажаты?
							if (that.modifiers[mod] && keys.indexOf(mod) == -1) allModifiersPressed = false;
						}

						if (allModifiersPressed) callback.apply(context, callbackArgs);
					}
				});
			}
		}
	}
}

//tinng.keyListener = new tinng.protos.KeyListener();
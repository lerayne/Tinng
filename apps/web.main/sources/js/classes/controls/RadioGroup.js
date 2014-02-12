/**
 * Created by Lerayne on 12.02.14.
 */

tinng.protos.ui.RadioGroup = function(config){
	t.funcs.bind(this, ['setCookie']);

	this.conf = t.funcs.objectConfig(config, this.configDefaults = {
		name:'defaultGroup',
		elements:[
			{type:'radio', value:1, text:'On'},
			{type:'radio', value:0, text:'Off'}
		],
		onClick:function(){},
		cookie:false
	});

	this.$body = $('<div class="radio-group"></div>');
	this.$allRadios = $([]);
	this.radios = {};
	this.options = [];

	for (var i = 0; i < this.conf.elements.length; i++) {
		var el = this.conf.elements[i];

		if (el.type == 'radio') {

			var $el = $('<input type="radio" name="'+ this.conf.name +'" value="'+ el.value +'" >');
			this.options.push(el.value);
			this.radios[el.value] = $el;
			this.$allRadios = this.$allRadios.add($el);

			var $label = $('<label>').append($el).append('<span>'+ el.text +'</span>')

		} else if (el.type == 'header') {
			var $label = $('<h4>'+ el.text +'</h4>');
		}

		$label.appendTo(this.$body);
	}

	if (this.conf.cookie) {
		var initOption = t.funcs.getCookie(this.conf.cookie);
		this.$allRadios.on('click', this.setCookie);
	} else {
		initOption = false
	}

	this.setValue(initOption);

	this.$allRadios.on('click', this.conf.onClick);
}

tinng.protos.ui.RadioGroup.prototype = {

	setValue:function(value){

		// ктивировать указанную опцию, иначе - первую
		if (this.radios[value]) {
			this.radios[value].prop('checked', true);
		} else {
			this.radios[this.options[0]].prop('checked', true);
		}
	},

	getValue:function(){
		return this.$allRadios.filter(':checked').val();
	},

	setCookie:function(){
		var val = this.getValue();

		t.funcs.setCookie({
			name:this.conf.cookie,
			value: val
		})
	},

	placeTo:function(element){
		element.append(this.$body);
	}
}

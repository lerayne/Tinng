/**
 * Created by Lerayne on 12.02.14.
 */

tinng.protos.ui.RadioGroup = function(config){
	t.funcs.bind(this, ['onClick']);

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

	this.currentVal = this.options[0];

	this.setValue(t.funcs.getCookie(this.conf.cookie));

	this.$allRadios.on('click', this.onClick);
}

tinng.protos.ui.RadioGroup.prototype = {

	setValue:function(value){

		// ктивировать указанную опцию, иначе - первую
		if (!this.radios[value]) value = this.currentVal;
		else this.currentVal = value;

		this.radios[value].prop('checked', true);
	},

	getValue:function(){
		return this.currentVal;
	},

	onClick:function(e){
		var value = $(e.currentTarget).val();

		this.currentVal = value;

		if (this.conf.cookie) this.setCookie()

		this.conf.onClick(e);
	},

	setCookie:function(){
		t.funcs.setCookie({
			name:this.conf.cookie,
			value: this.currentVal
		})
	},

	placeTo:function(element){
		element.append(this.$body);
	}
}

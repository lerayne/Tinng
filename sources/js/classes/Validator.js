/**
 * Created with JetBrains PhpStorm.
 * User: M. Yegorov
 * Date: 7/11/13
 * Time: 10:58 AM
 * To change this template use File | Settings | File Templates.
 */

// проверка данных формы
// requires: jQuery > 1.5; bind
t.protos.Validator = function (config) {

	t.funcs.bind(this);

	// наборы данных
	this.txt = {
		ru:{
			'err_required':'Это поле должно быть заполнено',
			'err_filetypes':'Выбран файл недопустимого типа',
			'err_required_box':'Этот флаг должен быть отмечен',
			'err_sysname':'Только латинские символы, цифры и _',
			'err_yyyy.MM.dd':'Нужна дата в формате yyyy.MM.dd',
			'err_phone':'От 7 до 20 знаков: только цифры, скобки, пробел, + и -',
			'err_number':'Требуется число',
			'err_email':'Требуется адрес e-mail',
			'err_eqref':'Пароли должны совпадать',
			'err_custom_exp': 'Неверный формат',
			'err_symbolsmin':'Слишком короткое значение',
			'err_symbolsmax':'Слишком длинное значение'
		}
	}

	// конфиг по умолчанию
	this.config = {
		passDisabled:false,
		language:'ru',
		notform:false,
		submitFunction: false,
		validationOff:false,
		filters:{}
	}

	// загрузка конфига
	for (var i in config) this.config[i] = config[i];

	for (var key in this.config.filters) {
		var filter = this.config.filters[key];

		this.txt[this.config.language]['err_'+key] = filter.errtext;
	}

	// базовые рабочие параметры
	this.checked = $([]);
	this.batchValidationsRemains = -1;
	this.submitIfPossible = false;

	this.form = config.form;
	this.submit = this.form.find('input[type="submit"]');
	this.elements =
		this.form.find('input[vldtr-enabled="true"], textarea[vldtr-enabled="true"], select[vldtr-enabled="true"]')
			.not(this.submit);

	// обработка случая, когда проверяется часть формы
	if (!this.form.is('form') || this.config.notform == true || typeof this.config.validateAllBtn != 'undefined'){
		this.submit = this.config.validateAllBtn;
	}

	// установка событий
	this.elements.change(this.resetSubmit);
	this.elements.change(this.validate);

	this.submit.prop('disabled', false);
	this.submit.click(this.submitForm);

}

t.protos.Validator.prototype = {

	submitForm:function () {
//		t.funcs.log('submitForm');
		this.submitIfPossible = true;
		this.validateAll();
		return false;
	},

	resetSubmit:function(){
		this.submitIfPossible = false;
	},

	validate:function (e, elem) {

		if (typeof e == 'object') {
			var element = jQuery(e.currentTarget);
		} else if (!!elem) {
			var element = jQuery(elem);
		}

		// если разрешено - пропускаем все disabled пполя как валидные
		if ((this.config.passDisabled && element.attr('disabled')) || this.config.validationOff) {
			this.addToValid(element); return;
		}

		// необходимость заполнения поля
		if (!!element.attr('vldtr-required') && element.prop('vldtr-required') != 'false') {
			if (!element.val() || element.val().match(/^\s*$/) || parseInt(element.val(),10) == 0) return this.invalid(element, 'err_required');
			if (element.is('[type="checkbox"]') && !element.is(':checked')) return this.invalid(element, 'err_required_box');
			if (element.is('select') && (parseInt(element.val(),10) == 0 || parseInt(element.val(),10) == -1)) return this.invalid(element, 'err_required');
		}

		// фильтры
		var filter = element.attr('vldtr-filter');
		if (!!filter) {

			if (typeof this.config.filters[filter].regexp != 'undefined') {

				var match = this.config.filters[filter].regexp;

			} else {

				switch (filter) {
					case 'sysname':
						var match = /^[a-zA-Z0-9._-]{1,}$/;
						break;
					case 'yyyy.MM.dd':
						var match = /^[0-9]{4,4}.[0-9]{2,2}.[0-9]{2,2}$/;
						break;
					case 'phone':
						var match = /^[ 0-9\)\(\+\-_]{7,20}$/;
						break;
					case 'number':
						var match = /^[0-9]{1,}$/;
						break;
					case 'email':
						var match = /^[-a-z0-9!#$%&'*+/=?^_`{|}~]+(?:\.[-a-z0-9!#$%&'*+/=?^_`{|}~]+)*@(?:[a-z0-9]([-a-z0-9]{0,61}[a-z0-9])?\.)*(?:aero|arpa|asia|biz|cat|com|coop|edu|gov|info|int|jobs|mil|mobi|museum|name|net|org|pro|tel|travel|[a-z][a-z])$/;
						break;
					/*case 'cent':
					 var match = /^[0-9]((.|,)[0-9]{0,2})??$/;
					 break;*/
					default:
						var match = new RegExp(filter);
						filter = 'custom_exp';
				}
			}

			//console.log(element.attr('name'), match)
			if (!element.val().match(match) && !element.val().match(/^$/))
				return this.invalid(element, 'err_' + filter)
		}

		// совпадение полей (чаще всего - паролей)
		var eqref = element.attr('vldtr-eqref');
		if (!!eqref) {
			var ref = this.form.find(eqref);
			if (element.val() == ref.val()) {
				this.restore(element);
				this.restore(ref);
			} else return this.invalid(element, 'err_eqref')
		}

		// допустимые типы файлов
		if (element.is('[type="file"]') && element.attr('vldtr-filetypes')){
			var types = element.attr('vldtr-filetypes').split(',');

			if (!element.val().match(/^$/)){
				var val = element.val().split('.');
				var ext = val[val.length-1];
				if (types.indexOf(ext) == -1) return this.invalid(element, 'err_filetypes')
			}
		}

		// минимальная длина
		var symbolsMin = element.attr('vldtr-symbolsmin');
		if (!!symbolsMin) {
			if (element.val().length < parseInt(symbolsMin,10)) return this.invalid(element, 'err_symbolsmin')
		}

		// максимальная длина
		var symbolsMax = element.attr('vldtr-symbolsmax');
		if (!!symbolsMax) {
			if (element.val().length > parseInt(symbolsMax,10)) return this.invalid(element, 'err_symbolsmax')
		}

		// проверка кастомной функцией
		var customCheck = element.attr('vldtr-funcname');

		if (!!customCheck && typeof this.customFuncs == 'object' && typeof this.customFuncs[customCheck] == 'function'){

			this.customFuncs[customCheck](element);

		} else {
			this.addToValid(element);
		}
	},

	addToValid:function(element){

		console.log('added to valid: ', element.attr('name'))

		this.checked = this.checked.add(element);
		this.restore(element);
		var passed = this.elements.size() == this.checked.size();

		if (passed && this.submitIfPossible) {
			if (typeof this.config.submitFunction == 'function') {
				console.log('fireing custom function')
				this.config.submitFunction();
			} else {
				console.log('standart submit')
				this.form.submit();
			}
		}

		this.validateNext();

		return false;
	},

	validateAll:function () {
		t.funcs.log('validateAll:', this.elements);
		this.checked = jQuery([]);

		if (this.elements.size() > 0) {

			this.batchValidationsRemains = this.elements.size();
			this.validateNext();

		} else {
			this.addToValid(jQuery([]))
		}

		/*if (this.elements.size() != this.checked.size()) {
		 t.funcs.log('not all elemets is validated! elements:', this.elements.size(), ', checked:', this.checked.size())
		 }*/
	},

	validateNext:function(){
		if (this.batchValidationsRemains > 0){
			this.batchValidationsRemains--;
			console.log('validateNext:', this.batchValidationsRemains)
			this.validate(0, this.elements.eq(this.batchValidationsRemains))
		}
	},

	invalid:function (element, err) {
		if (!element.attr('vldtr-backup-bcolor')) element.attr('vldtr-backup-bcolor', element.css('border-top-color'));

		var parent =  element.parent();
		var errMsg =  element.attr('vldtr-custom-errmsg') ? element.attr('vldtr-custom-errmsg') :
			typeof this.txt[this.config.language][err] != 'undefined' ? this.txt[this.config.language][err] : err;

		var messageContainer = element.attr('vldtr-errorPlaceId') ? jQuery('#'+element.attr('vldtr-errorPlaceId')) : element.parent();

		var errorMessage = messageContainer.find('.vldtr-error');

		if (errorMessage.size() == 0) {

			element.css('border-color', 'red');
			errorMessage = jQuery('<div class="vldtr-error" style="font-size:10px; color:red; display:none; white-space: normal">' +
				errMsg + '</div>');

			messageContainer.append(errorMessage);

			errorMessage.width(parent.width());
			errorMessage.slideDown(100);

		} else {
			errorMessage.html(errMsg)
		}

		t.funcs.log('ERROR in field "' + element.prop('name') + '" with value "' + element.val() + '": ' + errMsg)
		this.validateNext();

		return false;
	},

	restore:function (element) {

		if (element.attr('vldtr-backup-bcolor')) element.css('border-color', element.attr('vldtr-backup-bcolor'));
		else element.css('border-color', '#bbb');

		if (element.attr('vldtr-errorPlaceId')){
			jQuery('#'+element.attr('vldtr-errorPlaceId')).find('.vldtr-error').remove();
		} else {
			element.parent().find('.vldtr-error').remove();
		}
	},

	setValidated:function (element) {
		t.funcs.log('force validate', element)
	}
}
'use strict';


define('alerts', ['translator', 'components', 'hooks'], function (translator, components, hooks) {
	const module = {};

	module.alert = function (params) {
		params.alert_id = 'alert_button_' + (params.alert_id ? params.alert_id : new Date().getTime());
		params.title = params.title ? params.title.trim() || '' : '';
		params.message = params.message ? params.message.trim() : '';
		params.type = params.type || 'info';

		const alert = $('#' + params.alert_id);
		if (alert.length) {
			updateAlert(alert, params);
		} else {
			createNew(params);
		}
	};

	function createNew(params) {
		app.parseAndTranslate('alert', params, function (html) {
			let alert = $('#' + params.alert_id);
			if (alert.length) {
				return updateAlert(alert, params);
			}
			alert = html;
			alert.fadeIn(200);

			components.get('toaster/tray').prepend(alert);

			if (typeof params.closefn === 'function') {
				alert.find('button').on('click', function () {
					params.closefn();
					fadeOut(alert);
					return false;
				});
			}

			if (params.timeout) {
				startTimeout(alert, params);
			}

			if (typeof params.clickfn === 'function') {
				alert
					.addClass('pointer')
					.on('click', function (e) {
						if (!$(e.target).is('.close')) {
							params.clickfn(alert, params);
						}
						fadeOut(alert);
					});
			}

			hooks.fire('action:alert.new', { alert, params });
		});
	}

	module.remove = function (id) {
		$('#alert_button_' + id).remove();
	};

	function updateAlert(alert, params) {
		alert.find('strong').html(params.title);
		alert.find('p').html(params.message);
		alert.attr('class', 'alert alert-dismissable alert-' + params.type + ' clearfix');

		clearTimeout(parseInt(alert.attr('timeoutId'), 10));
		if (params.timeout) {
			startTimeout(alert, params);
		}

		alert.children().fadeOut(100);
		translator.translate(alert.html(), function (translatedHTML) {
			alert.children().fadeIn(100);
			alert.html(translatedHTML);
			hooks.fire('action:alert.update', { alert, params });
		});

		// Handle changes in the clickfn
		alert.off('click').removeClass('pointer');
		if (typeof params.clickfn === 'function') {
			alert
				.addClass('pointer')
				.on('click', function (e) {
					if (!$(e.target).is('.close')) {
						params.clickfn();
					}
					fadeOut(alert);
				});
		}
	}

	function fadeOut(alert) {
		alert.fadeOut(500, function () {
			$(this).remove();
		});
	}

	function startTimeout(alert, params) {
		const timeout = params.timeout;

		const timeoutId = setTimeout(function () {
			fadeOut(alert);

			if (typeof params.timeoutfn === 'function') {
				params.timeoutfn(alert, params);
			}
		}, timeout);

		alert.attr('timeoutId', timeoutId);

		// Reset and start animation
		alert.css('transition-property', 'none');
		alert.removeClass('animate');

		setTimeout(function () {
			alert.css('transition-property', '');
			alert.css('transition', 'width ' + (timeout + 450) + 'ms linear, background-color ' + (timeout + 450) + 'ms ease-in');
			alert.addClass('animate');
			hooks.fire('action:alert.animate', { alert, params });
		}, 50);

		// Handle mouseenter/mouseleave
		alert
			.on('mouseenter', function () {
				$(this).css('transition-duration', 0);
			});
	}

	return module;
});

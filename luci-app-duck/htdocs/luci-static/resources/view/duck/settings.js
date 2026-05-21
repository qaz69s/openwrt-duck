'use strict';
'require form';
'require fs';
'require poll';
'require rpc';
'require uci';
'require view';

var callServiceList = rpc.declare({
	object: 'service',
	method: 'list',
	params: ['name'],
	expect: { '': {} }
});

function getServiceStatus() {
	return L.resolveDefault(callServiceList('duck'), {}).then(function(res) {
		var isRunning = false;
		try {
			isRunning = res['duck']['instances']['instance1']['running'];
		} catch (e) {}
		return isRunning;
	});
}

function renderStatus(isRunning) {
	var spanTemp = '<em><span style="color:%s"><strong>%s %s</strong></span></em>';
	var renderHTML;
	if (isRunning)
		renderHTML = String.format(spanTemp, 'green', _('Duck'), _('RUNNING'));
	else
		renderHTML = String.format(spanTemp, 'red', _('Duck'), _('NOT RUNNING'));
	return renderHTML;
}

return view.extend({
	render: function() {
		var m, s, o;

		m = new form.Map('duck', _('Duck'), _('duck is a web UI for dae proxy.'));

		s = m.section(form.TypedSection);
		s.anonymous = true;
		s.render = function() {
			poll.add(function() {
				return L.resolveDefault(getServiceStatus()).then(function(res) {
					var statusEl = document.getElementById('service_status');
					statusEl.innerHTML = renderStatus(res);
				});
			});

			return E('div', { 'class': 'cbi-section', 'id': 'status_bar' }, [
				E('p', { 'id': 'service_status' }, _('Collecting data\u2026'))
			]);
		};

		s = m.section(form.NamedSection, 'global', 'duck', _('Global configuration'));

		o = s.option(form.Flag, 'enabled', _('Enable'));

		o = s.option(form.Button, '_panel', _('Dashboard'));
		o.inputtitle = _('Open Dashboard');
		o.inputstyle = 'apply';
		o.onclick = function() {
			var addr = uci.get('duck', 'global', 'listen_addr') || '0.0.0.0:2023';
			var parts = addr.split(':');
			var port = parts[parts.length - 1] || '2023';
			var host = window.location.hostname;
			window.open('http://' + host + ':' + port, '_blank');
		};

		o = s.option(form.Value, 'listen_addr', _('Listen address'));
		o.datatype = 'string';
		o.default = '0.0.0.0:2023';
		o.placeholder = '0.0.0.0:2023';

		o = s.option(form.Value, 'log_maxbackups', _('Log max backups'));
		o.datatype = 'uinteger';
		o.default = '1';

		o = s.option(form.Value, 'log_maxsize', _('Log max size (MB)'));
		o.datatype = 'uinteger';
		o.default = '5';

		return m.render();
	}
});

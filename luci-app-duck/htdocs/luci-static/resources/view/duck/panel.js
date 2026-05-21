'use strict';
'require view';
'require poll';
'require rpc';
'require uci';

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

return view.extend({
	load: function() {
		return Promise.all([
			uci.load('duck'),
			getServiceStatus()
		]).then(function(results) {
			var addr = uci.get('duck', 'global', 'listen_addr') || '0.0.0.0:2023';
			var parts = addr.split(':');
			var port = parts[1] || '2023';
			return {
				running: results[1],
				port: port,
				host: window.location.hostname
			};
		});
	},

	render: function(data) {
		var url = 'http://' + data.host + ':' + data.port;

		return E('div', { 'style': 'display:flex;flex-direction:column;height:calc(100vh - 180px)' }, [
			// 工具栏
			E('div', {
				'class': 'cbi-section',
				'style': 'display:flex;align-items:center;gap:12px;padding:8px 16px;margin-bottom:4px;flex-shrink:0'
			}, [
				E('span', { 'style': 'font-weight:600;font-size:14px' }, 'daed 管理面板'),
				E('span', { 'id': 'duck-panel-status' },
					data.running
						? '<span style="color:green">● 运行中</span>'
						: '<span style="color:red">● 已停止</span>'
				),
				E('a', {
					'href': url,
					'target': '_blank',
					'class': 'cbi-button cbi-button-action',
					'style': 'margin-left:auto;text-decoration:none'
				}, '新标签页打开')
			]),
			// iframe 嵌入
			E('iframe', {
				'src': url,
				'style': 'width:100%;flex:1;border:1px solid rgba(127,127,127,.18);border-radius:4px;background:#fff',
				'sandbox': 'allow-scripts allow-forms allow-same-origin'
			})
		]);
	},

	handleSave: null,
	handleSaveApply: null,
	handleReset: null
});

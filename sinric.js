const ws = require("ws");
const ReconnectingWebSocket = require('./libs/rws');
const ws_url = 'ws://iot.sinric.com';


module.exports = function (RED) {
    function SinricNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        if (config.key) {
            node.debug("Will try to connect with token: " + config.key);
            const ws_options = {
                headers: {
                    // needs node.js version >= 5.10.0 for this to work as Buffer.from() is added at that milestone!
                    'Authorization': Buffer.from('apikey:' + config.key).toString('base64')
                }
            };

            const client = new ReconnectingWebSocket(ws_url, ws_options);

            client.onopen = function(event){
                node.log('[RWS] Connected');
                node.status({text: 'Connected'});
            };

            client.onmessage = function(event){
                node.log('[RWS] Incomming Message');
                node.debug('[RWS.event]' + JSON.stringify(event.data));
                node.send({
                    payload: JSON.parse(event.data)
                });
            };
            
            //Node is closing
            this.on('close', () => {
                client.close();
            });
        }
    }
    RED.nodes.registerType("sinric", SinricNode);
};
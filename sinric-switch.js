module.exports = function (RED) {
    function SinricSwitchNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        if (config && config.deviceId) {
            node.on("input", function(msg){
                node.log(JSON.stringify(msg));

                if(msg && msg.payload && msg.payload.deviceId){
                    if(msg.payload.deviceId == config.deviceId){
                        msg.original_payload = msg.payload;

                        var action = msg.payload.action;
                        var value = msg.payload.value;

                        var api_call_sevice_output = null;
                        if(config.entityId){
                            api_call_sevice_output = {
                                payload: {
                                    domain: "switch",
                                    service: isOn ? "turn_on" : "turn_off",
                                    data: {
                                        entity_id : config.entityId
                                    }
                                }
                            };
                        }

                        node.send([
                          isOn ? null : { payload : 1},
                          isOn ? { payload : 1} : null,
                          api_call_sevice_output
                        ]);
                    }
                }else{
                    node.warn('Invalid message recieved');
                }
            });
            //Node is closing
            this.on('close', () => {
                //Do nothing.
            });
        }
    }

    RED.nodes.registerType("sinric-switch", SinricSwitchNode);
};
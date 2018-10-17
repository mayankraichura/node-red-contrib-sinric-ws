module.exports = function (RED) {
    function SinricSwitchNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        if (config && config.deviceId) {
            node.on("input", function(msg){
                node.log(JSON.stringify(msg));

                if(msg && msg.payload && msg.payload.deviceId){
                    if(msg.payload.deviceId == config.deviceId){
                        var action = msg.payload.action;
                        var value = msg.payload.value;

                        var isOn = false;


                        if(action == "setPowerState"){
                            //Alexa command
                            isOn = value == "ON";
                        }

                        if(action == "action.devices.commands.OnOff"){
                            //Google Assistant command
                            isOn = value.on && value.on == true;
                        }

                        node.send([
                            {
                                payload: isOn ? "on" : "off",
                            },{
                                payload: isOn ? 1 : 0
                            }    
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
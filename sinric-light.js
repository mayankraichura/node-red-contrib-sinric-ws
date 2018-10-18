const cc = require("color-convert");

module.exports = function (RED) {
    function SinricLightNode(config) {
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

                        var isOn = false;
                        var hasColor = false;
                        var hasBrightness = false;

                        var color = cc.hex.rgb("FFFFFF");
                        var brightness = 0;


                        if(action == "setPowerState"){
                            //Alexa command
                            isOn = value == "ON";
                        }

                        if(action == "action.devices.commands.OnOff"){
                            //Google Assistant command
                            isOn = value.on && value.on == true;
                        }

                        if(action == "action.devices.commands.BrightnessAbsolute"){
                            //Google Assistant brightness command
                            brightness = value.brightness;
                            isOn = brightness > 0;
                            hasBrightness = true;
                        }

                        if(action == "SetBrightness"){
                            brightness = value;
                            isOn = brightness > 0;
                            hasBrightness = true;
                        }

                        if(action == "action.devices.commands.ColorAbsolute"){
                            //Google Assistant color command
                            color = cc.ansi16.rgb(value.spectrumRGB);
                            isOn = true;
                            hasColor = true;
                        }

                        if(action == "SetColor"){
                            hasColor = true;
                            //color = cc.hsv.rgb(value.hue, value.saturation, value.brightness);
                            color = cc.hsv.hsl(value.hue, value.saturation, value.brightness);
                            isOn = true;
                        }

                        var api_call_sevice_output = null;
                        if(config.entityId){
                            api_call_sevice_output = {
                                payload: {
                                    domain: "switch",
                                    service: isOn ? "turn_on" : "turn_off"
                                }
                            };

                            if(isOn){

                            }
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

    RED.nodes.registerType("sinric-light", SinricLightNode);
};
const cc = require("color-convert");

module.exports = function (RED) {
    function SinricLightNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        this.nodeType = "light";
        this.deviceId = config.deviceId;
        this.entityId = config.entityId;
        this.client = config.client;
        this.sinricClient = RED.nodes.getNode(this.client);

        if(this.sinricClient){
            this.sinricClient.RegisterNode(this);
        }

        this.on("close", function () {
            if (this.sinricClient) {
                this.sinricClient.RemoveNode(this);
            }
        });
    }

    RED.nodes.registerType("sinric-light", SinricLightNode);

    SinricLightNode.prototype.NodeId = function(){
        return this.nodeType + "-" + this.deviceId;
    };

    SinricLightNode.prototype.OnMessage = function(cmd){
        if (cmd && cmd.deviceId && cmd.deviceId === this.deviceId) {
            this.log("[OnMessage]");
            this.log("Action: " + ": " + cmd.action);
            if(typeof cmd.action === "string"){
                this.log("Value: " + ": " + cmd.value);
            }else{
                this.log("Value: " + JSON.stringify(cmd.value));
            }

            var action = cmd.action;
            var value = cmd.value;

            var api_call_sevice_output = null;
            var isOn = false;
            var msg = {};
            msg.original = cmd;
            msg.payload = 1;

            var vHue = -1;
            var vSat = -1;
            var vBri = -1;
            var vKel = -1;

            /**** Alexa  ******/
            if (action === "setPowerState") {
                //Alexa command
                isOn = value == "ON";
            }

            if(action === "SetColorTemperature"){
                vKel = value;
                isOn = true;
            }

            if(action === "SetBrightness"){
                //Brigtness by Alexa;
                //[Alexa] Bri: 0 - 100
                //[HASS] Bri: 0 - 255

                vBri = value * 2.55;
                isOn = true;
            }

            if(action === "SetColor"){
                //Color by Alexa
                //[Alexa] Hue: 0 - 360; Sat: 0.0 - 1.0; Bri: 0.0 - 1.0
                //[HASS] Hue: 0 - 360; Sat: 0 - 100; Bri: 0 - 255

                //vBri = (value.brightness * 255). toFixed(0);
                vHue = (value.hue);
                vSat = (value.saturation * 100).toFixed(0);
                isOn = !(/*vBri === 0 &&*/ vHue === 0 && vSat === 0);
            }

            /******** Google Assistant ********/
            if (action === "action.devices.commands.OnOff") {
                //Google Assistant command
                isOn = value.on && value.on == true;
            }

            if(action === "action.devices.commands.BrightnessAbsolute"){
                vBri = value.brightness;
                isOn = true;
            }

            if(action === "action.devices.commands.ColorAbsolute"){
                if(value.name){
                    var keyHSL = cc.keyword.hsl(value.name);
                    vHue = keyHSL[0];               // 0 - 360
                    vSat = keyHSL[1];               // 0 - 100
                    //vBri = keyHSL[2] * 2.55;        // 0 - 255
                }else{
                    var rgbHSL = cc.ansi16.rgb(value.spectrumRGB);
                    vHue = rgbHSL[0];               // 0 - 360
                    vSat = rgbHSL[1];               // 0 - 100
                    //vBri = rgbHSL[2] * 2.55;        // 0 - 255
                }

                isOn = !(/*vBri === 0 &&*/ vHue === 0 && vSat === 0);
            }
            

            //Home Assistant entity_id is defined
            if (this.entityId) {
                api_call_sevice_output = {
                    domain: "light",
                    service: isOn ? "turn_on" : "turn_off",
                    data : {}
                };

                if(isOn){
                    if(vBri > -1){
                        data.brightness = vBri;
                    }

                    if(vHue > -1 || vSat > -1){
                        data.hs_color = [vHue, vSat];
                    }

                    if(vKel > -1){
                        data.kelvin = vKel;
                    }
                }
            }

            this.send([
                isOn ? null : msg,
                isOn ? msg : null,
                api_call_sevice_output,
                null /* Domoticz not yet supported */
            ]);
        }
    };
};
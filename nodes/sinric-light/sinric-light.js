const cc = require("color-convert");
//Convert

module.exports = function (RED) {
    function SinricLightNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        this.nodeType = "light";
        this.deviceId = config.deviceId;
        this.entityId = config.entityId;
        this.client = config.client;
        this.sinricClient = RED.nodes.getNode(this.client);

        if (this.sinricClient) {
            this.sinricClient.RegisterNode(this);
        }

        this.on("input", function (msg) {
            if (msg && msg.hasOwnProperty("payload")) {
                var toSend = {
                    deviceId: this.deviceId,
                    action: "setPowerState",
                    value: null
                };

                if (msg.payload === "1" || msg.payload === 1) {
                    toSend.value = "ON";
                    if (toSend.value) {
                        node.log("[Sending]" + JSON.stringify(toSend));
                        this.sinricClient.Write(JSON.stringify(toSend));
                    }
                } else if (msg.payload === "0" || msg.payload === 0) {
                    toSend.value = "OFF";
                    if (toSend.value) {
                        node.log("[Sending]" + JSON.stringify(toSend));
                        this.sinricClient.Write(JSON.stringify(toSend));
                    }
                } else {
                    try {
                        //Continue if and only if a Home Assistant entity_id is defined.
                        if (!this.entityId) {
                            node.warn('No Entity ID is defined. Cannot process this input.');
                            return; //Nope. Bye. Bye.
                        }

                        if (msg.topic && msg.topic === "state_changed") {
                            //This is a state changed message.
                            if (msg.payload && msg.payload.entity_id && msg.payload.entity_id === this.entityId) {
                                this.log(JSON.stringify(msg));
                                this.warn(msg);

                                //OK. We should be handling this event.
                                //Get the new state
                                var new_state = msg.payload.event.new_state.state;

                                if (new_state) {
                                    if (new_state && (new_state === "on" || new_state === "off")) {
                                        toSend.value = new_state === "on" ? "ON" : "OFF";
                                    } else {
                                        node.warn("Invalid event message. Cannot process");
                                    }

                                    if (toSend.value) {
                                        node.log("[Sending]" + JSON.stringify(toSend));
                                        node.send(toSend);
                                    }
                                }

                                var attr = msg.payload.event.new_state.attributes;
                                if (attr) {
                                    var vBri = attr.brightness;
                                    var vHS = attr.hs_color;

                                    toSend.action = "SetColor";
                                    toSend.value = {
                                        hue: Math.floor(vHS[0]),
                                        saturation: Number.parseFloat((vHS[1] / 100).toFixed(2)),
                                        brightness: Math.floor(vBri / 2.55)
                                    };

                                    this.warn(toSend);
                                    this.log(JSON.stringify(toSend));
                                }

                                //Check for new color

                                if (toSend.value) {
                                    this.sinricClient.Write(JSON.stringify(toSend));
                                }
                            }
                        }
                    } catch (err) {
                        node.error(err);
                    }
                }
            }
        });

        this.on("close", function () {
            if (this.sinricClient) {
                this.sinricClient.RemoveNode(this);
            }
        });
    }

    RED.nodes.registerType("sinric-light", SinricLightNode);

    SinricLightNode.prototype.NodeId = function () {
        return this.nodeType + "-" + this.deviceId;
    };


    SinricLightNode.prototype.OnMessage = function (cmd) {
        var node = this;

        if (cmd && cmd.deviceId && cmd.deviceId === this.deviceId) {
            this.log("[OnMessage]");
            this.log("Action: " + ": " + cmd.action);
            if (typeof cmd.action === "string") {
                this.log("Value: " + ": " + cmd.value);
            } else {
                this.log("Value: " + JSON.stringify(cmd.value));
            }





            var action = cmd.action.toString();
            var value = cmd.value;
            var cmd_type = null;


            var api_call_sevice_output = null;
            var isOn = false;
            var msg = {};
            msg.original = cmd;
            msg.payload = 1;

            var vHue = -1;
            var vSat = -1;
            var vBri = -1;
            var vKel = -1;

            if (action.indexOf("action.") > -1) {
                node.warn('Incomding Google Assistant Command');
                node.warn(JSON.stringify(cmd));

                /******** Google Assistant ********/
                if (action === "action.devices.commands.OnOff") {
                    //Google Assistant command
                    isOn = value.on && value.on == true;
                    cmd_type = "s";
                }

                if (action === "action.devices.commands.BrightnessAbsolute") {
                    vBri = value.brightness * 2.55;
                    isOn = true;
                    cmd_type = "b";
                }

                if (action === "action.devices.commands.ColorAbsolute") {
                    this.warn("value.color.name: " + typeof value.color.name);
                    this.warn("value.color.spectrumRGB: " + typeof value.color.spectrumRGB);

                    if (typeof value.color.spectrumRGB !== "undefined") {
                        /*
                        As per documentation at https://developers.google.com/actions/smarthome/traits/colorspectrum
                        Command: action.devices.commands.ColorAbsolute
                        Value: color Object. Required. Will include RGB or Temperature and optionally, a name.
                                name String. Color name (in English) as provided in the user's command. 
                                Not always available (for relative commands).
                                spectrumRGB Integer. Spectrum value in RGB (hex value as an integer).
                        */
                        var hex = (value.color.spectrumRGB - 0).toString(16);

                        if (hex.length === 2) {
                            hex = "0000" + hex;
                        }

                        if (hex.length === 4) {
                            hex = "00" + hex;
                        }


                        var rgb = cc.hex.rgb(hex);
                        var rgbHSL = cc.hex.hsl(hex);


                        console.log("value.color.spectrumRGB: " + value.color.spectrumRGB);
                        console.log("HEX: " + hex);
                        console.log("RGB: [" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "]");
                        console.log("HSL: [" + rgbHSL[0] + "," + rgbHSL[1] + "," + rgbHSL[2] + "]");

                        vHue = rgbHSL[0]; // 0 - 360
                        vSat = rgbHSL[1]; // 0 - 100
                        if (value.color.name && typeof value.color.name === "string" && value.color.name.indexOf("white") > -1) {
                            vBri = rgbHSL[2] * 2.55; // 0 - 255
                        }

                        isOn = !( /*vBri === 0 &&*/ vHue === 0 && vSat === 0);
                        cmd_type = "c";
                    }

                    if (typeof value.color.temperature !== "undefined") {
                        vKel = value.color.temperature;
                        var vHSL = cc.hex.hsl("ffffff");
                        vHue = vHSL[0];
                        vSat = vHSL[1];
                        //vBri = 255;

                        isOn = true;
                        cmd_type = "t";
                    }
                }
            }else{
                node.warn('Incomding Alexa Command');
                node.warn(JSON.stringify(cmd));
                /**** Alexa  ******/
                if (action === "setPowerState") {
                    //Alexa command
                    isOn = value == "ON";
                    cmd_type = "s";
                }

                if (action === "SetColorTemperature") {
                    vHue = 0;
                    vSat = 0;
                    vKel = Number.parseInt(value);
                    isOn = true;
                    cmd_type = "t";
                }

                if (action === "SetBrightness") {
                    //Brigtness by Alexa;
                    //[Alexa] Bri: 0 - 100
                    //[HASS] Bri: 0 - 255

                    vBri = value * 2.55;
                    isOn = true;

                    cmd_type = "b";
                }

                if (action === "SetColor") {
                    //Color by Alexa
                    //[Alexa] Hue: 0 - 360; Sat: 0.0 - 1.0; Bri: 0.0 - 1.0
                    //[HASS] Hue: 0 - 360; Sat: 0 - 100; Bri: 0 - 255
                    node.log("Alexa: Set Color");
                    node.log(JSON.stringify(value));

                    //vBri = (value.brightness * 255). toFixed(0);
                    vHue = Number.parseInt(value.hue);
                    vSat = Number.parseInt((value.saturation * 100).toFixed(0));
                    isOn = !( /*vBri === 0 &&*/ vHue === 0 && vSat === 0);
                    cmd_type = "c";
                }
            }

            node.warn({
                "cmd_type": cmd_type,
                "bri": vBri,
                "hue": vHue,
                "sat": vSat,
                "temperature": vKel
            });

            //Home Assistant entity_id is defined
            if (this.entityId) {
                api_call_sevice_output = {
                    payload: {
                        domain: "light",
                        service: isOn ? "turn_on" : "turn_off",
                        data: {
                            entity_id: this.entityId
                        }
                    }
                };

                if (cmd && cmd !== "s" && isOn) {
                    api_call_sevice_output.payload.data.transition =  1;

                    if (cmd_type === "b" && vBri > -1) {
                        api_call_sevice_output.payload.data.brightness = vBri;
                    }

                    if (cmd_type === "c" && (vHue > -1 || vSat > -1)) {
                        api_call_sevice_output.payload.data.hs_color = [vHue, vSat];
                    }

                    if (cmd_type === "t" && vKel > -1) {
                        api_call_sevice_output.payload.data.kelvin = vKel;
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
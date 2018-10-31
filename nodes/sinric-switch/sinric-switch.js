module.exports = function (RED) {
    function SinricSwitchNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        this.deviceId = config.deviceId;
        this.entityId = config.entityId;
        this.idx = config.idx;
        this.client = config.client;
        this.nodeType = "switch";
        this.sinricClient = RED.nodes.getNode(this.client);

        if (this.sinricClient) {
            //We have working client.
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
                } else if (msg.payload === "0" || msg.payload === 0) {
                    toSend.value = "OFF";
                } else {
                    try {
                        //Continue if and only if a Home Assistant entity_id is defined.
                        if (this.entityId) {
                            if (msg.topic && msg.topic === "state_changed") {
                                //This is a state changed message.
                                if (msg.payload && msg.payload.entity_id && msg.payload.entity_id === this.entityId) {
                                    //OK. We should be handling this event.
                                    //Get the new state
                                    var new_state = msg.payload.event.new_state.state;
    
                                    if (new_state) {
                                        if (new_state && (new_state === "on" || new_state === "off")) {
                                            toSend.value = new_state === "on" ? "ON" : "OFF";
                                        } else {
                                            node.warn("Invalid event message. Cannot process");
                                        }
                                    }
                                }
                            }
                        }

                        if(this.idx){
                            if(msg.payload && msg.payload.idx && msg.payload.idx === this.idx){
                                if(typeof msg.payload.nvalue !== undefined){
                                    toSend.value = msg.payload.nvalue === 1 ? "ON" : "OFF";
                                }
                            }
                        }
                    } catch (err) {
                        node.error(err);
                    }
                }

                if (toSend.value) {
                    node.log("[Sending]" + JSON.stringify(toSend));
                    this.sinricClient.Write(JSON.stringify(toSend));
                }
            }
        });

        this.on("close", function () {
            if (this.sinricClient) {
                this.sinricClient.RemoveNode(this);
            }
        });
    }

    SinricSwitchNode.Send = function (msg) {
        if (this.sinricClient) {
            this.sinricClient.Write(msg);
        }
    }

    RED.nodes.registerType("sinric-switch", SinricSwitchNode);

    SinricSwitchNode.prototype.NodeId = function () {
        return this.nodeType + "-" + this.deviceId;
    };

    SinricSwitchNode.prototype.OnMessage = function (cmd) {
        this.log("[OnMessage]");
        if (cmd && cmd.deviceId && cmd.deviceId === this.deviceId) {
            this.log("Action: " + ": " + cmd.action);
            this.log("Value: " + ": " + cmd.value);

            var action = cmd.action;
            var value = cmd.value;
            var api_call_sevice_output = null;
            var domoticz_output = null;
            var isOn = false;
            var msg = {};
            msg.original = cmd;
            msg.payload = 1;

            if (action == "setPowerState") {
                //Alexa command
                isOn = value == "ON";
            }

            if (action == "action.devices.commands.OnOff") {
                //Google Assistant command
                isOn = value.on && value.on == true;
            }

            //Home Assistant entity_id is defined
            if (this.entityId) {
                api_call_sevice_output = {
                    payload: {
                        domain: "switch",
                        service: isOn ? "turn_on" : "turn_off",
                        data: {
                            entity_id: this.entityId
                        }
                    }
                };
            }

            if (this.idx && !isNaN(parseInt(this.idx))) {
                var numIdx = parseInt(this.idx);
                if (numIdx > 0) {
                    domoticz_output = {
                        payload: {
                            idx: numIdx,
                            nvalue: isOn ? 1 : 0
                        }
                    };
                }
            }

            this.send([
                isOn ? null : msg,
                isOn ? msg : null,
                api_call_sevice_output,
                domoticz_output
            ]);
        }
    };
};
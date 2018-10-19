module.exports = function (RED) {
    function SinricSwitchNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        this.deviceId = config.deviceId;
        this.entityId = config.entityId;
        this.idx = config.idx;
        this.client = config.client;
        this.nodeType = "switch";
        this.sirnricClient = RED.nodes.getNode(this.client);

        if (this.sirnricClient) {
            //We have working client.
            this.sirnricClient.RegisterNode(this);
        }

        this.on("close", function () {
            if (this.sirnricClient) {
                this.sirnricClient.RemoveNode(this);
            }
        });
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

            if(this.idx && !isNaN(parseInt(this.idx))){
                var numIdx = parseInt(this.idx);
                if(numIdx > 0 ){
                    domoticz_output = {
                        payload : {
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
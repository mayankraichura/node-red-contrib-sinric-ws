module.exports = function (RED) {
    function SinricHASetPowerStateNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        this.deviceId = config.deviceId;
        this.entityId = config.entityId;
        this.client = config.client;
        this.nodeType = "ha-setpowerstate";
        this.sinricClient = RED.nodes.getNode(this.client);

        this.on("input", function(msg){
            if(msg && msg.hasOwnProperty("payload")){
                try{
                    node.warn(msg.topic);
                    node.warn(this.entityId);
                    if(msg.topic === this.entityId){
                       if(msg.payload === "on" || msg.payload === "off"){
                            msg.original = msg.payload;
                            msg.payload = {
                                deviceId: this.deviceId,
                                action: "setPowerState",
                                value: msg.payload === "on" ? "ON" : "OFF"
                            };

                            node.log(JSON.stringify(msg));
                            node.send(msg);
                       }else{
                           node.warn("Paylod should contain either `on` or `off`");
                       }
                    }
                }catch(err){
                    node.console.error(err);
                }
            }
        });
    }

    RED.nodes.registerType("sinric-ha-setpowerstate", SinricHASetPowerStateNode);

    SinricHASetPowerStateNode.prototype.NodeId = function () {
        return this.nodeType + "-" + this.deviceId;
    };    
};
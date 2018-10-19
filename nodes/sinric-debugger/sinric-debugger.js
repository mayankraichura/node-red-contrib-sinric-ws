module.exports = function (RED) {
    function SinricDebuggerNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        this.nodeType = "debugger";
        this.client = config.client;
        if (this.client) {
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
        } else {
            node.error("[SinricDebuggerNode] config was empty!");
        }
    }

    RED.nodes.registerType("sinric-debugger", SinricDebuggerNode);

    SinricDebuggerNode.prototype.OnMessage = function (cmd) {
        this.send(cmd);
    };

    SinricDebuggerNode.prototype.NodeId = function(){
        return this.nodeType;
    }
};
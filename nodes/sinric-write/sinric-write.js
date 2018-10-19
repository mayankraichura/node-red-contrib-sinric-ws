module.exports = function (RED) {
    function SinricWriteNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        this.client = config.client;
        this.nodeType = "write";
        this.sinricClient = RED.nodes.getNode(this.client);

        this.on("input", function (msg) {
            if (msg && msg.hasOwnProperty("payload")) {
                node.warn("[TYPE]: " + typeof msg.payload);
                //The object has a payload
                //Check if string
                if (typeof msg.payload === "string") {
                    if (isJson(msg.payload)) {
                        this.sinricClient.Write(msg.payload);
                    } else {
                        node.warn("A valid JSON object or string is required.");
                    }
                } else {
                    this.sinricClient.Write(JSON.stringify(msg.payload));
                }
            }
        });
    }

    function isJson(str) {
        try {
            JSON.parse(str);
            return true;
        } catch (e) {
            return false;
        }
    }
    RED.nodes.registerType("sinric-write", SinricWriteNode);

    SinricWriteNode.prototype.NodeId = function () {
        return this.nodeType;
    };
};
module.exports = function (RED) {
    "use strict";

    const ws = require("ws");
    const ReconnectingWebSocket = require('../../libs/rws');
    const ws_url = 'ws://iot.sinric.com';

    function SinricWsClientNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.RED = RED;
        this.connected = false;
        this._handlerNodes = [];

        this.key = config.key;
        
        this.pinger = setInterval(function(){
            if(this.connected){
                node.Ping();
            }
        }, 300000);



        if (this.key) {
            node.debug("Will try to connect with token: " + config.key);
            const ws_options = {
                headers: {
                    // needs node.js version >= 5.10.0 for this to work as Buffer.from() is added at that milestone!
                    'Authorization': Buffer.from('apikey:' + config.key).toString('base64')
                }
            };

            var client = new ReconnectingWebSocket(ws_url, ws_options);

            this.websocket = client;

            client.onopen = function(event){
                node.connected = true;
                node.log('[RWS] Connected');
                if(this._handlerNodes){
                    for(var i = 0; i < node._handlerNodes.length; i++){
                        node._handlerNodes[i].status({text: "Connected"});
                    }
                }
                // node.status({
                //     text: 'Connected',
                //     fill: "green",
                //     shape: "dot"
                // });
            };

            client.onmessage = function(event){
                node.log('[RWS] Incomming Message');
                node.debug('[RWS.event]' + JSON.stringify(event.data));
                // node.send({
                //     payload: JSON.parse(event.data)
                // });

                node.PublishCommand(event.data);
            };
            
            //Node is closing
            this.on('close', () => {
                client.close();
                node.connected = false;
            });
        }
    }

    RED.nodes.registerType("sinric-ws-client", SinricWsClientNode);


    
    SinricWsClientNode.prototype.Ping = function(){
        if(this.connected){
            this.websocket.send("H");
        }
    };


    SinricWsClientNode.prototype.PublishCommand = function(data){
        this.log("[PublishCommand]");
        this.log(data);
        var cmd = JSON.parse(data);
        for(var i = 0; i < this._handlerNodes.length; i++){
            this._handlerNodes[i].OnMessage(cmd);
        }
    };

    SinricWsClientNode.prototype.Write = function(str){
        this.log("[WRITE] " + str);
        this.log("[Connected] " + this.connected);
        this.log("[Client]" + this.websocket);
        if(this.connected && this.websocket){
            try{
                this.websocket.send(str);
            }catch(e){
                this.error(e);
            }
        }
    }

    SinricWsClientNode.prototype.RegisterNode =  function(n){
        if(n){
            this.log("Register Node: " + n.NodeId());
            this._handlerNodes.push(n);
        }
    };

    SinricWsClientNode.prototype.RemoveNode = function(n){
        if(n){
            this.log("Remove Node: " + n.NodeId());
            this._handlerNodes.forEach(function (node, i, inputNodes) {
                if (node === n) {
                    inputNodes.splice(i, 1);
                }
            });
        }
    };
};


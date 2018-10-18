# Node Red nodes for Sinric

**Disclaimer: I'm not the creater of Sinric. That credit goes to awesome Aruna Tennakoon (@kakopappa). You will find the original Sinric repo [here](https://github.com/kakopappa/sinric)**.

# About Sinric
[Sinric](https://sinric.com) is a platform that helps you to integrate your existing devices (such as RaspberryPi, ESP8226, ESP32 or Arduino) with Amazon Alexa or Google Home for **FREE**! It has a native Alexa Smart Home skill that you can link with in Alexa app or, with a bit of efforts, be able able to link it to your Google Home/Assistant app. What's special about this platform is that **you don't have to open up any ports in firewall and no messy router configuration**. 

# About This Module
The features of Sinric makes it ideal for open-source home-automation platforms such as Home Assistant, Domoticz etc. Sinric platform requires that the communication be done via websocket with special headers containing the API key. However, the native websocket implementation of Node Red does not allow configuration of additional headers and I've created this simple nodes that wrap all the complexity into two simple nodes.

### `Sinric` node 
This node is just a wrapper around nodejs websocket library with some reconnection code to make it reliable. It outputs anything that it receives from the sinric platform.

### `Sinric Switch` node
This node takes one input and three outputs. Ideally it expects the output of the `Sinric` node as input and a `Device ID` as configuration parameter. It will look for `On/Off` command and if it receives one for the specified device, based on command, it will have following output states.
 - Output 1: It will output `1` if a switch off command is received. Otherwise, no output.
 - Output 2: It will output `1` if a switch **ON** command is received. Otherwise, no output.
 - Output 3: This output was specifically written with Home Assistant in mind (`AYapejian/node-red-contrib-home-assistant` to be exact) and outputs a JSON object that can be directly consumed by `Call Service`.

# Installation
`node-red-contrib-sinric-ws` is not published to NPM repo yet because it is still in premature stage and experimental. If you want to experiment with you, you'll have to manually install it using following steps.

 - Goto to your Node Red user directory. 
   - In Linux/Mac, it's usually in `~/.node-red`
   - In Windows, it will be under `C:\Users\<Your Username>\.node-red`
 - Run the following command:
   - `npm install mayankraichura/node-red-contrib-sinric-ws`
 - Restart Node-Red.

# TODO
### Refactoring
This is my first ever Node Red module and so it has some rough edges. Specifically, the `websocket` implementation is wrapped inside the `Sinric` node. I plan to extract that to a `config` node acting as proxy for all the remaining ndoes.
### Add support for status feedback
At this point, there is no support to report the state of the devices back to Sinric and by extension to Alexa/Google Assistant. Sinric will try to remember the last state it had executed but would be oblivious of any external state changes (eg. MQTT, manual switching etc). Sinric has some level of support to report back this state changes and need to be implemented in near future.
### Add more devices support.
Sinric platform has support for lots of device types and I've only implemented a `Switch` type. Slowly, I plan to add support for additional devices supported by Sinric. Here is the list of device types supported by Sinric. I'll cross them off as I implement them in this module.

- ~~Switch~~
- Light (Working on it)
- Thermostat
- Window Shutters
- TV
- Speaker
- Smart Lock
- Projector

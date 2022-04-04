"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socketio = __importStar(require("socket.io"));
const fs_1 = __importDefault(require("fs"));
const io = new socketio.Server({
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const passwordServer = "UR5_CTITO";
class driverInstance {
    constructor(id) {
        this.onState = false;
        this.subscriptors = [];
        this.id = id;
    }
    setOnState(value) {
        this.onState = value;
    }
    getData() {
        return {
            name: this.name,
            onState: this.onState,
            id: this.id
        };
    }
    getStates() {
        return {
            onState: this.onState
        };
    }
    getNameIdentifier() {
        return this.name || this.id;
    }
    set setName(name) {
        this.name = name;
    }
    addSubscriptor(identifier) {
        this.subscriptors.push(identifier);
    }
    rmSubscriptor(identifier) {
        this.subscriptors = this.subscriptors.filter((value) => {
            return value !== identifier;
        });
    }
}
let controlArray = [];
let driverArray = [];
const getDriverArrayIndex = (identifier) => {
    return driverArray.findIndex((value) => {
        return value.getNameIdentifier() === identifier;
    });
};
let printNum = 0;
const printAJSON = (jsonObj) => {
    // stringify JSON Object
    const jsonContent = JSON.stringify(jsonObj);
    console.log(jsonContent);
    fs_1.default.writeFile("output " + printNum++ + ".json", jsonContent, 'utf8', function (err) {
        if (err) {
            console.log("An error occured while writing JSON Object to File.");
            return console.log(err);
        }
        console.log("JSON file has been saved.");
    });
};
io.on("connection", (socket) => {
    console.log("Connection");
    if (socket.handshake.headers.password !== passwordServer) {
        socket.disconnect();
        console.log("Socket disconnect by wrong password");
        printAJSON(socket.handshake);
        printAJSON(socket.data);
        return;
    }
    else {
        if (socket.handshake.headers.isdriver === "driver") {
            // Add to driver list
            console.log("newDriver");
            const currentDriverInstance = new driverInstance(socket.id);
            driverArray.push(currentDriverInstance);
            socket.emit("acceptConnection", socket.id);
            io.emit("newDrivers", driverArray.map((value) => { return value.getNameIdentifier(); }));
        }
        else {
            console.log("isDriver: " + socket.handshake.headers.isdriver);
            // Add to control list
            controlArray.push(socket.id);
            socket.emit("acceptConnection", socket.id, driverArray.map((value) => { return value.getNameIdentifier(); }));
        }
        console.log("current driver list: " + JSON.stringify(driverArray.map((value) => { return value.getNameIdentifier(); })));
    }
    socket.on("setName", (name) => {
        const currentIndexDriver = driverArray.findIndex((value) => { return value.id === socket.id; });
        if (currentIndexDriver === -1)
            return;
        driverArray[currentIndexDriver].name = name;
    });
    socket.on("connectToDriver", (identifier) => {
        const driverID = getDriverArrayIndex(identifier);
        console.log("Index array: " + driverID);
        if (driverID === -1)
            return;
        driverArray[driverID].addSubscriptor(socket.id);
        console.log("added subscriptor");
        socket.emit("driverConnected", driverArray[driverID].onState);
        console.log("emit");
    });
    socket.on("disconnect", () => {
        if (socket.handshake.headers.isdriver === "driver") {
            console.log("Has been disconnected the driver with the id: " + socket.id);
            driverArray = driverArray.filter((value) => {
                return value.id !== socket.id;
            });
            io.emit("newDrivers", driverArray.map((value) => { return value.getNameIdentifier(); }));
        }
        else {
            console.log("Has been disconnected the control with the id: " + socket.id);
            controlArray = controlArray.filter((value) => {
                return value === socket.id;
            });
            for (let i = 0; i < driverArray.length; i++)
                if (driverArray[i].subscriptors.includes(socket.id))
                    driverArray[i].rmSubscriptor(socket.id);
        }
    });
    socket.on("setValueOnStatus", (onState, identifier) => {
        const driverID = getDriverArrayIndex(identifier);
        console.log("Index array: " + driverID);
        if (driverID === -1)
            return;
        driverArray[driverID].setOnState(onState);
        console.log(`Set onState: ${onState} to the driver: ${driverArray[driverID].id}`);
        io.to(driverArray[driverID].id).emit("updateState", onState);
        for (let i = 0; i < driverArray[driverID].subscriptors.length; i++) {
            const subscriptorID = driverArray[driverID].subscriptors[i];
            if (subscriptorID !== socket.id) {
                console.log(subscriptorID);
                io.to(subscriptorID).emit("updateState", onState);
            }
        }
    });
});
io.listen(3010);
//# sourceMappingURL=index.js.map
import * as http from "http";
import * as socketio from "socket.io";
import fs from 'fs';

interface ServerToClientEvents {
    noArg: () => void;
    basicEmit: (a: number, b: string, c: Buffer) => void;
    acceptConnection: (socketID: string, driverArray?: string[]) => void;
    newDrivers: (driverArray: string[]) => void;
    driverConnected: (onState: boolean, metalicState: boolean, noMetalicState: boolean) => void;
    updateState: (newState: boolean) => void;
    updateMetalicState: (newState: boolean) => void;
    updateNonMetalicState: (newState: boolean) => void;


}

interface ClientToServerEvents {
    hello: () => void;
    set_use: (password: string, isDriver: boolean) => void;
    setName: (name: string) => void;
    connectToDriver: (identifier: string) => void;
    setValueOnStatus: (onState: boolean, identifier: string) => void;
    setMetalicStatusVal: (onState: boolean, identifier: string) => void;
    setNoMetalicStatusVal: (onState: boolean, identifier: string) => void;

}

interface InterServerEvents {
    ping: () => void;
}

interface SocketData {
    name: string;
    age: number;
}

const io = new socketio.Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>({
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const passwordServer = "UR5_CTITO"

class driverInstance {
    name: string | undefined;
    onState: boolean = false;
    metalicState: boolean = false;
    noMetalicState: boolean = false;
    id: string;
    subscriptors: string[] = []

    constructor(id: string) {
        this.id = id;
    }

    public setOnState(value: boolean) {
        this.onState = value;
    }

    public setMetalicState(value: boolean) {
        this.metalicState = value;
    }

    public setNoMetalicState(value: boolean) {
        this.noMetalicState = value;
    }

    public getData(): {
        name?: string;
        onState: boolean;
        id: string;
    } {
        return {
            name: this.name,
            onState: this.onState,
            id: this.id
        }
    }

    public getStates() {
        return {
            onState: this.onState
        }
    }

    public getNameIdentifier(): string {
        return this.name || this.id
    }

    public set setName(name: string) {
        this.name = name
    }

    public addSubscriptor(identifier: string) {
        this.subscriptors.push(identifier)
    }

    public rmSubscriptor(identifier: string) {
        this.subscriptors = this.subscriptors.filter((value: string) => {
            return value !== identifier
        })
    }
}

let controlArray: string[] = []
let driverArray: driverInstance[] = []


const getDriverArrayIndex = (identifier: string): number => {
    return driverArray.findIndex((value: driverInstance) => {
        return value.getNameIdentifier() === identifier
    })
}

let printNum: number = 0;

const printAJSON = (jsonObj: any) => {
    // stringify JSON Object
    const jsonContent = JSON.stringify(jsonObj);
    console.log(jsonContent);

    fs.writeFile("output " + printNum++ + ".json", jsonContent, 'utf8', function (err: any) {
        if (err) {
            console.log("An error occured while writing JSON Object to File.");
            return console.log(err);
        }

        console.log("JSON file has been saved.");
    });
}

io.on("connection", (socket) => {
    console.log("Connection")
    if (socket.handshake.headers["user-agent"] === "arduino-WebSocket-Client") console.log("Arduino connected")


    if (socket.handshake.headers.password !== passwordServer && socket.handshake.headers["user-agent"] !== "arduino-WebSocket-Client") {
        socket.disconnect()
        console.log("Socket disconnect by wrong password")
        printAJSON(socket.handshake)
        printAJSON(socket.data)

        return
    } else {
        if (socket.handshake.headers.isdriver === "driver" || socket.handshake.headers["user-agent"] === "arduino-WebSocket-Client") {
            // Add to driver list
            console.log("newDriver")
            const currentDriverInstance = new driverInstance(socket.id)
            driverArray.push(currentDriverInstance)

            socket.emit("acceptConnection", socket.id)
            io.emit("newDrivers", driverArray.map((value: driverInstance) => { return value.getNameIdentifier() }))
        } else {
            console.log("isDriver: " + socket.handshake.headers.isdriver)
            // Add to control list
            controlArray.push(socket.id)
            socket.emit("acceptConnection", socket.id, driverArray.map((value: driverInstance) => { return value.getNameIdentifier() }))
        }
        console.log("current driver list: " + JSON.stringify(driverArray.map((value: driverInstance) => { return value.getNameIdentifier() })))

    }



    socket.on("setName", (name: string) => {
        const currentIndexDriver = driverArray.findIndex((value: driverInstance) => { return value.id === socket.id })
        if (currentIndexDriver === -1) return
        driverArray[currentIndexDriver].name = name
    })

    socket.on("connectToDriver", (identifier: string) => {
        const driverID = getDriverArrayIndex(identifier);
        console.log("Index array: " + driverID)
        if (driverID === -1) return
        driverArray[driverID].addSubscriptor(socket.id)
        console.log("added subscriptor")
        socket.emit("driverConnected", driverArray[driverID].onState, driverArray[driverID].metalicState, driverArray[driverID].noMetalicState)
        console.log("emit")
    })



    socket.on("disconnect", () => {
        if (socket.handshake.headers.isdriver === "driver" || socket.handshake.headers["user-agent"] === "arduino-WebSocket-Client") {
            console.log("Has been disconnected the driver with the id: " + socket.id)
            driverArray = driverArray.filter((value: driverInstance) => {
                return value.id !== socket.id

            })
            io.emit("newDrivers", driverArray.map((value: driverInstance) => { return value.getNameIdentifier() }))
        } else {
            console.log("Has been disconnected the control with the id: " + socket.id)
            controlArray = controlArray.filter((value: string) => {
                return value === socket.id
            })
            for (let i = 0; i < driverArray.length; i++) if (driverArray[i].subscriptors.includes(socket.id)) driverArray[i].rmSubscriptor(socket.id)

        }
    });

    socket.on("setValueOnStatus", (onState: boolean, identifier: string) => {
        const driverID = getDriverArrayIndex(identifier);
        console.log("Index array: " + driverID)
        if (driverID === -1) return
        driverArray[driverID].setOnState(onState)

        console.log(`Set onState: ${onState} to the driver: ${driverArray[driverID].id}`)

        io.to(driverArray[driverID].id).emit("updateState", onState)

        for (let i = 0; i < driverArray[driverID].subscriptors.length; i++) {

            const subscriptorID = driverArray[driverID].subscriptors[i];
            if (subscriptorID !== socket.id) {
                console.log(subscriptorID)
                io.to(subscriptorID).emit("updateState", onState)
            }


        }


    })
    socket.on("setMetalicStatusVal", (onState: boolean, identifier: string) => {
        const driverID = getDriverArrayIndex(identifier);
        console.log("Index array: " + driverID)
        if (driverID === -1) return
        driverArray[driverID].setMetalicState(onState)

        console.log(`Set metalic state: ${onState} to the driver: ${driverArray[driverID].id}`)

        io.to(driverArray[driverID].id).emit("updateMetalicState", onState)

        for (let i = 0; i < driverArray[driverID].subscriptors.length; i++) {

            const subscriptorID = driverArray[driverID].subscriptors[i];
            if (subscriptorID !== socket.id) {
                console.log(subscriptorID)
                io.to(subscriptorID).emit("updateMetalicState", onState)
            }

        }


    })
    socket.on("setNoMetalicStatusVal", (onState: boolean, identifier: string) => {
        const driverID = getDriverArrayIndex(identifier);
        console.log("Index array: " + driverID)
        if (driverID === -1) return
        driverArray[driverID].setNoMetalicState(onState)

        console.log(`Set no metalic state: ${onState} to the driver: ${driverArray[driverID].id}`)

        io.to(driverArray[driverID].id).emit("updateNonMetalicState", onState)

        for (let i = 0; i < driverArray[driverID].subscriptors.length; i++) {

            const subscriptorID = driverArray[driverID].subscriptors[i];
            if (subscriptorID !== socket.id) {
                console.log(subscriptorID)
                io.to(subscriptorID).emit("updateNonMetalicState", onState)
            }

        }


    })


});

io.listen(3010);
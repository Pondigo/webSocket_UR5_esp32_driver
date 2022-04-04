import BootstrapSwitchButton from 'bootstrap-switch-button-react';
import { Console } from 'console';
import React, { createRef, LegacyRef, useState } from 'react'
import io, { Socket } from 'socket.io-client';

export default function useSocket() {
    let socket: Socket<any, any> | undefined;
    const [setSwitchStatusRef, setSetSwitchStatusRef] = useState<(newOnStatus: boolean) => void>()
    const [socketState, setSocketState] = useState<Socket<any, any>>()
    const [isWaiting, setIsWaiting] = useState(false)
    const [isReady, setIsReady] = useState(false)
    const [status, setStatus] = useState<boolean>()
    const [driverList, setDriverList] = useState<string[]>()
    const [sessionID, setSessionID] = useState<string>()
    const [driverSelected, setDriverInnerSelected] = useState<string>()

    const setDriverSelected = (value: string) => {
        console.log("setDriverSelected")
        if (!socketState) return
        console.log("Socket aviable")
        setDriverInnerSelected(value)
        socketState.emit("connectToDriver", value)
        console.log("Connect to " + value)
    }

    const initSocket = (password: string, isDriver: boolean) => {
        setIsWaiting(true)
        socket = io('http://20.121.66.225:3010', {
            extraHeaders: {
                password: password,
                isDriver: isDriver ? "driver" : "control"
            }
        });
        socket.on("acceptConnection", (socketID: string, driverArray?: string[]) => {
            console.log(`Socket id: ${socketID}`)
            setSessionID(socketID)
            setIsWaiting(false)
            setIsReady(true)
            if (driverArray) setDriverList(driverArray)

        })
        socket.on("disconnect", () => {
            console.log(`Socket disconnect`)
            setIsWaiting(false)
            setIsReady(false)
        })

        socket.on("newDrivers", (driverArray: string[]) => {
            setDriverList(driverArray)
        })

        socket.on("driverConnected", (onState: boolean) => {
            setStatus(onState)
            console.log("enter?")
            console.log("onstate: " + onState)
        })

        socket.on("updateState", (newState: boolean) => {
            console.log("update state")
            setStatus(newState)
        })




        setSocketState(socket)

        //socket.emit("set_use", password, isDriver)
    }

    const setStatusVal = (newOnStatus: boolean) => {
        console.log("setStatusVal")
        if (!socketState) return
        console.log("Socket aviable")
        setStatus(newOnStatus)
        socketState.emit("setValueOnStatus", newOnStatus, driverSelected)
    }






    return {
        initSocket, isWaiting, isReady, driverList, sessionID, driverSelected, setDriverSelected, status, setStatusVal
    }


}

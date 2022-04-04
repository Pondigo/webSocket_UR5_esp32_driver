import React, { useState, createRef, useRef, LegacyRef, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import BootstrapSwitchButton, { ColorsOutline, Colors } from 'bootstrap-switch-button-react'

import { Button, Container, Form, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import styled from 'styled-components';
import useSocket from './Hooks/useSocket';

interface BootstrapSwitchButtonProps {
  /**
   * Function to call when the SwitchButton is changed
   */
  onChange?: (checked: boolean) => void;
  checked?: boolean;
  disabled?: boolean;
  onlabel?: string;
  offlabel?: string;
  onstyle?: Colors | ColorsOutline;
  offstyle?: Colors | ColorsOutline;
  size?: "xs" | "sm" | "lg";
  style?: string;
  width?: number;
  height?: number;
}


const AppMainWrapper = styled.div`
  display: flex;
  height: 80vh;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  .divDeviceSelector{
    margin-bottom:12vh;
  }
  .switch.btn{
    min-width: 94px;
  }
  .form-control{
    text-align: center;
  }
  

`

const SwitchWrapper = styled.div`
display:content;
`





function App() {


  const switchStatusRef: LegacyRef<BootstrapSwitchButton> = createRef<BootstrapSwitchButton>()

  const setSwitchStatusRef = (newOnStatus: boolean) => {
    console.log("update to " + newOnStatus)
    console.log(switchStatusRef.current)
    if (switchStatusRef.current) {
      console.log("enter")
      switchStatusRef.current.setState({
        checked: newOnStatus
      })

    }
  }

  const { initSocket, isWaiting, isReady, driverList, sessionID, driverSelected, setDriverSelected, status, setStatusVal } = useSocket()

  const [isDriver, setIsDriver] = useState(false)


  const isDriverRef: LegacyRef<BootstrapSwitchButton> = createRef<BootstrapSwitchButton>()

  const getSwitchVal = () => {
    let valueSwitch: boolean = false
    if (isDriverRef.current !== null) {
      const state: BootstrapSwitchButtonProps = isDriverRef.current.state
      valueSwitch = state.checked === true ? true : false
    }
    setIsDriver(valueSwitch)
    return valueSwitch
  }

  const initSession = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    const password = passwordRef.current?.value
    if (!password || password.replace(" ", "") === "") return

    console.log("The pass is: " + password)
    initSocket(password, getSwitchVal())

  }

  const passwordRef = createRef<HTMLInputElement>()



  const SwitchDiv = () => {



    return (
      <>
        <p>Tipo de dispositivo:</p>
        <SwitchWrapper>
          <BootstrapSwitchButton
            ref={isDriverRef}


            disabled={isWaiting}
            onstyle="outline-success"
            offstyle="outline-danger"
            onlabel='Driver'
            offlabel='Control'
          />
        </SwitchWrapper>
        <br />
        <br />
      </>
    )
  }




  const InitSessionForm = () => {
    return (
      <AppMainWrapper>

        <Form.Group className="mb-3" controlId="formBasicPassword">
          <Form.Label>Contraseña</Form.Label>
          <Form.Control ref={passwordRef} disabled={isWaiting} type="password" placeholder="Contraseña" />
        </Form.Group>
        <br />
        <div className="divDeviceSelector">

          {!isWaiting ? <SwitchDiv /> : null}
          <Button
            variant="primary"
            disabled={isWaiting}
            onClick={!isWaiting ? initSession : undefined}

          >
            {isWaiting ? 'Cargando…' : 'Iniciar sesion'}
          </Button>
        </div>




      </AppMainWrapper>
    )
  }
  const DriverDropdown = () => {
    const dropDownClick = (event: any) => {
      if (driverList?.includes(event.target.textContent)) {
        setDriverSelected(event.target.textContent)
      }

    }


    return (
      <Navbar variant="light" bg="light" expand="lg">
        <Container fluid>
          <Navbar.Brand href="#home">{driverSelected ? driverSelected : "Seleccione un controlador"}</Navbar.Brand>
          <Navbar.Toggle aria-controls="navbar-light-example" />
          <Navbar.Collapse id="navbar-light-example">
            <Nav>
              <NavDropdown
                onClick={(dropDownClick)}
                id="nav-dropdown-light-example"
                title="Lista de controladores"
                menuVariant="light"
              >
                {driverList?.map((value: string) => <NavDropdown.Item eventKey={value}>{value}</NavDropdown.Item>)}
                <NavDropdown.Divider />
                <NavDropdown.Item eventKey={"Logout"}>Cerrar sesión</NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    )
  }

  const ControlStatus = () => {

    const switchOnState = () => {

      if (!switchStatusRef.current) return
      const switchStateValue: BootstrapSwitchButtonProps = switchStatusRef.current.state

      setStatusVal(switchStateValue.checked !== undefined ? !switchStateValue.checked : false)
    }

    const handleClickOnSSB = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
      switchOnState()
    }
    /* 
        useEffect(() => {
          const setSwitchStatusRef = (newOnStatus: boolean) => {
            console.log("hereeee")
            console.log("update to " + newOnStatus)
            console.log(switchStatusRef.current)
            if (switchStatusRef.current) {
              console.log("enter")
              switchStatusRef.current.setState({
                checked: newOnStatus
              })
    
            }
          }
    
          setSetSwitchStatusRef(setSwitchStatusRef)
    
        }, []) */




    return (
      <>
        <p>Enciende o apaga el proceso</p>
        <SwitchWrapper onClick={handleClickOnSSB}>
          <BootstrapSwitchButton
            checked={status}
            key={"onStateSwitchButton"}
            ref={switchStatusRef}
            onstyle="outline-success"
            offstyle="outline-danger"
            onlabel='On'
            offlabel='Off'
          />
        </SwitchWrapper>
        <br />

      </>

    )
  }

  const ControlView = () => {
    return (
      <AppMainWrapper>
        <DriverDropdown />
        <br />
        {status !== undefined ? <ControlStatus /> : null}
        <br />
        <br />




      </AppMainWrapper>
    )
  }


  const SimDriverView = () => {

    return (
      <AppMainWrapper>
        <p>Session ID: {sessionID}</p>
        <p>{status ? "On" : "Off"}</p>
      </AppMainWrapper>
    )
  }

  return (
    <div className="App">
      <br />
      <p className='titleMain'>Control remoto - Clasificador TITO UR5</p>
      <hr />

      {!isReady ? <InitSessionForm /> : null}
      {isReady && !isDriver ? <ControlView /> : null}
      {isReady && isDriver ? <SimDriverView /> : null}



    </div>
  );
}

export default App;

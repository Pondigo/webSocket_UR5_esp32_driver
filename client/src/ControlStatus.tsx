import BootstrapSwitchButton, { Colors, ColorsOutline } from 'bootstrap-switch-button-react';
import React, { createRef, LegacyRef } from 'react'
import styled from 'styled-components';



interface IControlStatusProps {
    setVal: (newOnStatus: boolean) => void;
    mainLabel: string;
    onLabel: string;
    offLabel: string;
    statusVal: boolean;
}


const SwitchWrapper = styled.div`
display:content;

`

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

export default (props: IControlStatusProps) => {
    const switchStatusRef: LegacyRef<BootstrapSwitchButton> = createRef<BootstrapSwitchButton>()

    const switchOnState = () => {

        if (!switchStatusRef.current) return
        const switchStateValue: BootstrapSwitchButtonProps = switchStatusRef.current.state

        props.setVal(switchStateValue.checked !== undefined ? !switchStateValue.checked : false)
    }

    const handleClickOnSSB = () => {
        switchOnState()
    }



    return (
        <>
            <p>{props.mainLabel}</p>
            <SwitchWrapper onClick={handleClickOnSSB}>
                <BootstrapSwitchButton
                    checked={props.statusVal}
                    key={"onStateSwitchButton"}
                    ref={switchStatusRef}
                    onstyle="outline-success"
                    offstyle="outline-danger"
                    onlabel={props.onLabel}
                    offlabel={props.offLabel}
                />
            </SwitchWrapper>
            <br />

        </>

    )
}
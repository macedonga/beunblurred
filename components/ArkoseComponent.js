import React from "react";
import PropTypes from "prop-types";
export default class Arkose extends React.Component {
    constructor() {
        super();
        this.myEnforcement = null;
        this.scriptId = "";
    }
    removeScript = () => {
        const currentScript = document.getElementById(this.scriptId);
        if (currentScript) {
            currentScript.remove();
        }
    };
    // Append the JS tag to the Document Body.
    loadScript = () => {
        this.removeScript();
        const script = document.createElement("script");
        script.id = this.scriptId;
        script.type = "text/javascript";
        script.src = "https://client-api.arkoselabs.com/v2/api.js";
        script.setAttribute("data-callback", "setupEnforcement");
        script.async = true;
        script.defer = true;
        if (this.props.nonce) {
            script.setAttribute("data-nonce", this.props.nonce);
        }
        document.body.appendChild(script);
        return script;
    };
    setupEnforcement = (myEnforcement) => {
        this.myEnforcement = myEnforcement;
        this.myEnforcement.setConfig({
            publicKey: this.props.publicKey,
            data: { blob: "" },
            isSDK: true,
            accessibilitySettings: {
                lockFocusToModal: true
            },
            selector: this.props.selector,
            mode: this.props.mode,
            onReady: () => {
                this.props.onReady();
            },
            onShown: () => {
                this.props.onShown();
            },
            onShow: () => {
                this.props.onShow();
            },
            onSuppress: () => {
                this.props.onSuppress();
            },
            onCompleted: (response) => {
                this.props.onCompleted(response.token);
            },
            onReset: () => {
                this.props.onReset();
            },
            onHide: () => {
                this.props.onHide();
            },
            onError: (response) => {
                this.props.onError(response?.error);
            },
            onFailed: (response) => {
                this.props.onFailed(response);
            }
        });
    };
    componentDidMount() {
        this.scriptId = `arkose-script-${this.props.publicKey}`;
        const scriptElement = this.loadScript();
        // This will inject required html and css after the Arkose script is properly loaded
        scriptElement.onload = () => {
            console.log("Arkose API Script loaded");
            window.setupEnforcement = this.setupEnforcement.bind(this);
        };
        // If there is an error loading the Arkose script this callback will be called
        scriptElement.onerror = () => {
            console.log("Could not load the Arkose API Script!");
        };
    }
    componentWillUnmount() {
        if (window.setupEnforcement) {
            delete window.setupEnforcement;
        }
        this.removeScript();
    }
    render() {
        return (
            <>
                {this.props.mode === "inline" && <div id={this.props?.selector?.slice(1)}></div>}
            </>
        );
    }
}
Arkose.propTypes = {
    publicKey: PropTypes.string.isRequired,
    mode: PropTypes.oneOf(["inline", "lightbox"]),
    selector: PropTypes.string, // Any valid DOM selector is allowed here
    nonce: PropTypes.string,
    onReady: PropTypes.func,
    onShown: PropTypes.func,
    onShow: PropTypes.func,
    onSuppress: PropTypes.func,
    onCompleted: PropTypes.func,
    onReset: PropTypes.func,
    onHide: PropTypes.func,
    onError: PropTypes.func,
    onFailed: PropTypes.func
};
Arkose.defaultProps = {
    onReady: () => { },
    onShown: () => { },
    onShow: () => { },
    onSuppress: () => { },
    onCompleted: () => { },
    onReset: () => { },
    onHide: () => { },
    onError: () => { },
    onFailed: () => { }
};
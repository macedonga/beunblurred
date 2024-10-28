import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import PropTypes from "prop-types";

const Arkose = forwardRef(({ publicKey, onCompleted, onError, ...props }, ref) => {
    const iframeRef = useRef(null);
    const [isButtonDisabled, setButtonDisabled] = useState(true);

    // Function to open the Arkose iframe challenge
    const openArkoseIframe = () => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            const message = {
                publicKey,
                eventId: "challenge-open",
            };
            iframeRef.current.contentWindow.postMessage(JSON.stringify(message), "*");
        }
    };

    // Expose openArkoseIframe to the parent component via ref
    useImperativeHandle(ref, () => ({
        openArkoseIframe,
    }));

    // Listen for Arkose messages and handle events
    useEffect(() => {
        const handleArkoseMessage = (event) => {
            if (!event.data || typeof event.data === "object") return;

            const data = JSON.parse(event.data);

            switch (data.eventId) {
                case "challenge-loaded":
                    setButtonDisabled(false);
                    break;
                case "challenge-complete":
                    onCompleted(data.payload.sessionToken);
                    iframeRef.current.style.display = "none";
                    break;
                case "challenge-show":
                    iframeRef.current.style.display = "block";
                    break;
                case "challenge-hide":
                    iframeRef.current.style.display = "none";
                    break;
                case "challenge-error":
                    onError && onError("An error occurred during verification.");
                    break;
                default:
                    break;
            }
        };

        window.addEventListener("message", handleArkoseMessage);
        return () => {
            window.removeEventListener("message", handleArkoseMessage);
        };
    }, [onCompleted, onError]);

    return (
        <div>
            <iframe
                id="arkoseFrame"
                ref={iframeRef}
                src={`https://iframe.arkoselabs.com/${publicKey}/lightbox.html`}
                style={{
                    display: "none",
                }}
                className="absolute z-[9999] inset-0 w-full h-full"
            ></iframe>
        </div>
    );
});

Arkose.propTypes = {
    publicKey: PropTypes.string.isRequired,
    onCompleted: PropTypes.func.isRequired,
    onError: PropTypes.func,
};

export default Arkose;

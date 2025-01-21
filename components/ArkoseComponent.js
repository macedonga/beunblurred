import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import PropTypes from "prop-types";

const Arkose = forwardRef(({ publicKey, onCompleted, onError, ...props }, ref) => {
    const iframeRef = useRef(null);
    const [URL, setURL] = useState(null);
    const [LoadChallenge, setLoadChallenge] = useState(false);

    const openArkoseIframe = () => {
        setLoadChallenge(true);
    };

    useImperativeHandle(ref, () => ({
        openArkoseIframe,
    }));

    useEffect(() => {
        const fetchB64Url = async () => {
            const captchaHtml = await fetch("/captcha.html");
            const captchaHtmlText = await captchaHtml.text();

            const captchaHtmlB64 = btoa(unescape(encodeURIComponent(captchaHtmlText)));

            setURL(`data:text/html;base64,${captchaHtmlB64}`);
        };

        const handleArkoseMessage = (event) => {
            if (!event.data || typeof event.data === "object") return;

            const data = JSON.parse(event.data);
            console.log("Arkose message", data);

            switch (data.eventId) {
                case "challenge-complete":
                    onCompleted(data.payload.sessionToken);
                    iframeRef.current.style.display = "none";
                    break;
                case "challenge-shown":
                    iframeRef.current.style.display = "block";
                    break;
                case "challenge-hide":
                    iframeRef.current.style.display = "none";
                    break;
                case "challenge-error":
                    onError && onError("An error occurred during verification.");
                    break;
                case "challenge-suppressed":
                    onError && onError("You need to complete the captcha to login.");
                    break;
                default:
                    break;
            }
        };

        fetchB64Url();
        window.addEventListener("message", handleArkoseMessage);
        return () => {
            window.removeEventListener("message", handleArkoseMessage);
        };
    }, [onCompleted, onError]);

    if (!URL || !LoadChallenge) return null;
    return (
        <div>
            <iframe
                src={URL}
                ref={iframeRef}
                id="arkoseFrame"
                allowtransparency="true"
                className="absolute z-[9999] inset-0 w-full h-full"
                style={{
                    backgroundColor: "transparent",
                    border: "none",
                    display: "none",
                }}
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
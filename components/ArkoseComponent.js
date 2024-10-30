import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import PropTypes from "prop-types";

function generateRandomString(length) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

const Arkose = forwardRef(({ publicKey, onCompleted, onError, ...props }, ref) => {
    const iframeRef = useRef(null);
    const [isButtonDisabled, setButtonDisabled] = useState(true);

    const URL = "data:text/html;base64,PGh0bWw+DQoNCjxoZWFkPg0KICAgIDxtZXRhIGNoYXJzZXQ9InV0Zi04Ij4NCiAgICA8dGl0bGU+QXV0aGVudGljYXRpb248L3RpdGxlPg0KICAgIDxzY3JpcHQ+DQogICAgICAgIHZhciBzY3JpcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTsNCiAgICAgICAgc2NyaXB0LnR5cGUgPSAndGV4dC9qYXZhc2NyaXB0JzsNCiAgICAgICAgc2NyaXB0LmFzeW5jID0gdHJ1ZTsNCiAgICAgICAgc2NyaXB0LmRlZmVyID0gdHJ1ZTsNCiAgICAgICAgc2NyaXB0LnNyYyA9ICdodHRwczovL2NsaWVudC1hcGkuYXJrb3NlbGFicy5jb20vdjIvQ0NCMDg2M0UtRDQ1RC00MkU5LUE2QzgtOUU4NTQ0RThCMTdFL2FwaS5qcycNCiAgICAgICAgc2NyaXB0LnNldEF0dHJpYnV0ZSgnZGF0YS1jYWxsYmFjaycsICdzZXR1cEVuZm9yY2VtZW50Jyk7DQoNCiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXS5hcHBlbmRDaGlsZChzY3JpcHQpOw0KDQogICAgICAgIHZhciBpbnRlcnZhbCA9IHNldEludGVydmFsKGZ1bmN0aW9uICgpIHsNCiAgICAgICAgICAgIGZyYW1lSGVpZ2h0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoImZjLWlmcmFtZS13cmFwIikub2Zmc2V0SGVpZ2h0Ow0KICAgICAgICAgICAgZnJhbWVXaWR0aCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCJmYy1pZnJhbWUtd3JhcCIpLm9mZnNldFdpZHRoOw0KICAgICAgICAgICAgcGFyZW50LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsNCiAgICAgICAgICAgICAgICBldmVudElkOiAiY2hhbGxlbmdlLWlmcmFtZVNpemUiLA0KICAgICAgICAgICAgICAgIHBheWxvYWQ6IHsNCiAgICAgICAgICAgICAgICAgICAgZnJhbWVIZWlnaHQ6IGZyYW1lSGVpZ2h0LA0KICAgICAgICAgICAgICAgICAgICBmcmFtZVdpZHRoOiBmcmFtZVdpZHRoDQogICAgICAgICAgICAgICAgfQ0KICAgICAgICAgICAgfSksICIqIikNCiAgICAgICAgfSwgMzAwMCk7DQoNCiAgICAgICAgZnVuY3Rpb24gc2V0dXBFbmZvcmNlbWVudChteUVuZm9yY2VtZW50KSB7DQogICAgICAgICAgICBteUVuZm9yY2VtZW50LnNldENvbmZpZyh7DQogICAgICAgICAgICAgICAgc2VsZWN0b3I6ICcjYXJrb3NlJywNCiAgICAgICAgICAgICAgICBtb2RlOiAnaW5saW5lJywNCiAgICAgICAgICAgICAgICBvbkNvbXBsZXRlZDogZnVuY3Rpb24gKHJlc3BvbnNlKSB7DQogICAgICAgICAgICAgICAgICAgIHBhcmVudC5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7DQogICAgICAgICAgICAgICAgICAgICAgICBldmVudElkOiAiY2hhbGxlbmdlLWNvbXBsZXRlIiwNCiAgICAgICAgICAgICAgICAgICAgICAgIHBheWxvYWQ6IHsNCiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXNzaW9uVG9rZW46IHJlc3BvbnNlLnRva2VuDQogICAgICAgICAgICAgICAgICAgICAgICB9DQogICAgICAgICAgICAgICAgICAgIH0pLCAiKiIpDQogICAgICAgICAgICAgICAgfSwNCiAgICAgICAgICAgICAgICBvblJlYWR5OiBmdW5jdGlvbiAocmVzcG9uc2UpIHsNCiAgICAgICAgICAgICAgICAgICAgcGFyZW50LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsNCiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50SWQ6ICJjaGFsbGVuZ2UtbG9hZGVkIiwNCiAgICAgICAgICAgICAgICAgICAgfSksICIqIikNCiAgICAgICAgICAgICAgICB9LA0KICAgICAgICAgICAgICAgIG9uU3VwcHJlc3M6IGZ1bmN0aW9uIChyZXNwb25zZSkgew0KICAgICAgICAgICAgICAgICAgICBwYXJlbnQucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoew0KICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnRJZDogImNoYWxsZW5nZS1zdXBwcmVzc2VkIiwNCiAgICAgICAgICAgICAgICAgICAgfSksICIqIikNCiAgICAgICAgICAgICAgICB9LA0KICAgICAgICAgICAgICAgIG9uU2hvd246IGZ1bmN0aW9uIChyZXNwb25zZSkgew0KICAgICAgICAgICAgICAgICAgICBwYXJlbnQucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoew0KICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnRJZDogImNoYWxsZW5nZS1zaG93biIsDQogICAgICAgICAgICAgICAgICAgIH0pLCAiKiIpOw0KICAgICAgICAgICAgICAgIH0sDQogICAgICAgICAgICAgICAgb25GYWlsZWQ6IGZ1bmN0aW9uIChyZXNwb25zZSkgew0KICAgICAgICAgICAgICAgICAgICBwYXJlbnQucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoew0KICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnRJZDogImNoYWxsZW5nZS1mYWlsZWQiLA0KICAgICAgICAgICAgICAgICAgICAgICAgcGF5bG9hZDogew0KICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlc3Npb25Ub2tlbjogcmVzcG9uc2UudG9rZW4NCiAgICAgICAgICAgICAgICAgICAgICAgIH0NCiAgICAgICAgICAgICAgICAgICAgfSksICIqIik7DQogICAgICAgICAgICAgICAgfSwNCiAgICAgICAgICAgICAgICBvbkVycm9yOiBmdW5jdGlvbiAocmVzcG9uc2UpIHsNCiAgICAgICAgICAgICAgICAgICAgcGFyZW50LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsNCiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50SWQ6ICJjaGFsbGVuZ2UtZXJyb3IiLA0KICAgICAgICAgICAgICAgICAgICAgICAgcGF5bG9hZDogew0KICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiByZXNwb25zZS5lcnJvcg0KICAgICAgICAgICAgICAgICAgICAgICAgfQ0KICAgICAgICAgICAgICAgICAgICB9KSwgIioiKTsNCiAgICAgICAgICAgICAgICB9LA0KICAgICAgICAgICAgICAgIG9uUmVzaXplOiBmdW5jdGlvbiAocmVzcG9uc2UpIHsNCiAgICAgICAgICAgICAgICAgIHZhciBkZWZhdWx0SGVpZ2h0ID0gNDUwOw0KICAgICAgICAgICAgICAgICAgdmFyIGRlZmF1bHRXaWR0aCA9IDQwMDsNCiAgICAgICAgICAgICAgICAgIHZhciBoZWlnaHQgPSByZXNwb25zZSAmJiByZXNwb25zZS5oZWlnaHQgPyByZXNwb25zZS5oZWlnaHQgOiBkZWZhdWx0SGVpZ2h0Ow0KICAgICAgICAgICAgICAgICAgdmFyIHdpZHRoID0gcmVzcG9uc2UgJiYgcmVzcG9uc2Uud2lkdGggPyByZXNwb25zZS53aWR0aCA6IGRlZmF1bHRXaWR0aDsNCiAgICAgICAgICAgICAgICAgIHRyeSB7DQogICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaGVpZ2h0ID09PSAnc3RyaW5nJykgew0KICAgICAgICAgICAgICAgICAgICAgIGhlaWdodCA9IGhlaWdodC5yZXBsYWNlKCdweCcsICcnKTsNCiAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQgPSBwYXJzZUludChoZWlnaHQsIDEwKTsNCiAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNOYU4oaGVpZ2h0KSkgew0KICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gZGVmYXVsdEhlaWdodDsNCiAgICAgICAgICAgICAgICAgICAgICB9DQogICAgICAgICAgICAgICAgICAgIH0NCiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB3aWR0aCA9PT0gJ3N0cmluZycpIHsNCiAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IHdpZHRoLnJlcGxhY2UoJ3B4JywgJycpOw0KICAgICAgICAgICAgICAgICAgICAgIHdpZHRoID0gcGFyc2VJbnQod2lkdGgsIDEwKTsNCiAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNOYU4od2lkdGgpKSB7DQogICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IGRlZmF1bHRXaWR0aDsNCiAgICAgICAgICAgICAgICAgICAgICB9DQogICAgICAgICAgICAgICAgICAgIH0NCiAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHsNCiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gZGVmYXVsdEhlaWdodDsNCiAgICAgICAgICAgICAgICAgICAgd2lkdGggPSBkZWZhdWx0V2lkdGg7DQogICAgICAgICAgICAgICAgICB9DQogICAgICAgICAgICAgICAgICAgIHBhcmVudC5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7DQogICAgICAgICAgICAgICAgICAgICAgZXZlbnRJZDogImNoYWxsZW5nZS1pZnJhbWVTaXplIiwNCiAgICAgICAgICAgICAgICAgICAgICBwYXlsb2FkOiB7DQogICAgICAgICAgICAgICAgICAgICAgICBmcmFtZUhlaWdodDogaGVpZ2h0LA0KICAgICAgICAgICAgICAgICAgICAgICAgZnJhbWVXaWR0aDogd2lkdGgNCiAgICAgICAgICAgICAgICAgICAgICB9DQogICAgICAgICAgICAgICAgICAgIH0pLCAiKiIpDQogICAgICAgICAgICAgICAgfQ0KICAgICAgICAgICAgfSk7DQogICAgICAgIH0NCg0KICAgIDwvc2NyaXB0Pg0KPC9oZWFkPg0KDQo8Ym9keSBzdHlsZT0ibWFyZ2luOiAwcHgiPg0KICAgIDxkaXYgaWQ9ImFya29zZSI+DQogICAgPC9kaXY+DQo8L2JvZHk+DQoNCjwvaHRtbD4NCg==";

    // Function to open the Arkose iframe challenge
    const openArkoseIframe = () => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.style.display = "block";
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
                    onCompleted(data.payload.sessionToken.split("|")[0]);
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
                src={`https://${generateRandomString(10)}.beunblurred.co`}
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

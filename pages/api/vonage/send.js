import axios from "axios";
import { isValidPhoneNumber } from "react-phone-number-input";
import { fetchSignature } from "@/utils/requests";

const ArkoseKey = "CCB0863E-D45D-42E9-A6C8-9E8544E8B17E";
const BeRealClientSecret = "F5A71DA-32C7-425C-A3E3-375B4DACA406";

function generateRandomDouble(decimalPlaces) {
    let randomDouble = "0.";
    for (let i = 0; i < decimalPlaces; i++) {
        randomDouble += Math.floor(Math.random() * 10);
    }
    return randomDouble;
}

async function getArkoseToken() {
    const publicKeyPayload = new URLSearchParams({
        "bda": process.env.ARKOSE_BDA_KEY,
        "public_key": ArkoseKey,
        "site": "file://",
        "userbrowser": "Mozilla/5.0 (Linux; ... Build/UP1A.231105.003; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0.6668.100 Mobile Safari/537.36",
        "capi_version": "2.11.0",
        "capi_mode": "inline",
        "style_theme": "default",
        "rnd": generateRandomDouble(17),
        "data[blob]": ""
    });

    const publicKeyResponse = await fetch(`https://client-api.arkoselabs.com/fc/gt2/public_key/${ArkoseKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: publicKeyPayload
    });

    if (!publicKeyResponse.ok) throw new Error("Internal server error while getting public key response");

    const publicKeyResponseContent = await publicKeyResponse.json();
    const unformattedToken = publicKeyResponseContent.token;
    const token = unformattedToken.substring(0, 28);

    const callbackName = "__jsonp_" + Date.now();

    const queryParameters = new URLSearchParams({
        "callback": callbackName,
        "category": "loaded",
        "action": "game loaded",
        "session_token": token,
        "data[public_key]": ArkoseKey,
        "data[site]": "file://"
    });

    const callbackResponse = await fetch(`https://client-api.arkoselabs.com/fc/a/?${queryParameters}`, {
        method: "GET"
    });

    if (!callbackResponse.ok) throw new Error("Error while sending callback request");

    return token;
}

export default async function handler(req, res) {
    try {
        const { phone } = req.body;

        if (!phone) return res.status(400).json({ error: "Missing phone number", success: false });
        if (!isValidPhoneNumber(phone)) return res.status(400).json({ error: "Invalid phone number", success: false });

        let arkoseToken;
        
        try {
            arkoseToken = await getArkoseToken();
        } catch (error) {
            return res.status(500).json({ error: "Couldn't fetch Arkose token.", success: false });
        }

        const response = await axios.post(
            `https://auth-l7.bereal.com/token/phone`,
            {
                "phone_number": phone,
                "client_id": "android",
                "client_secret": BeRealClientSecret,
                "device_id": Array.from(Array(16), () => Math.floor(Math.random() * 36).toString(36)).join(''),
                "tokens": [
                    {
                        "token": arkoseToken,
                        "identifier": "AR"
                    }
                ]
            },
            {
                "headers": {
                    "Accept": "*/*",
                    "User-Agent": "BeReal/3.10.1 (com.bereal.ft; build:2348592; Android 14) 4.12.0/OkHttp",
                    "x-ios-bundle-identifier": "AlexisBarreyat.BeReal",
                    "Content-Type": "application/json",
                    "bereal-app-version-code": "2348592",
                    "bereal-app-version": "3.10.1",
                    "bereal-signature": (await fetchSignature()),
                    "bereal-device-id": "937v3jb942b0h6u9",
                    "bereal-timezone": "Europe/Paris",
                }
            }
        );

        if (response.status > 299) return res.status(500).json({ error: "Internal server error", success: false });

        res.status(200).json({
            success: true,
        });
        return;
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Internal server error", success: false });
    }
};
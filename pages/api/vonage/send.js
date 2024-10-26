import axios from "axios";
import { isValidPhoneNumber } from "react-phone-number-input";
import { fetchSignature } from "@/utils/requests";

const BeRealClientSecret = "F5A71DA-32C7-425C-A3E3-375B4DACA406";

export default async function handler(req, res) {
    try {
        const { phone, token } = req.body;

        if (!phone) return res.status(400).json({ error: "Missing phone number", success: false });
        if (!isValidPhoneNumber(phone)) return res.status(400).json({ error: "Invalid phone number", success: false });
        if (!token) return res.status(400).json({ error: "Missing token", success: false });

        const response = await axios.post(
            `https://auth-l7.bereal.com/token/phone`,
            {
                "phone_number": phone,
                "client_id": "android",
                "client_secret": BeRealClientSecret,
                "device_id": "937v3jb942b0h6u9",
                "tokens": [
                    {
                        "token": token,
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
                },
                "proxy": process.env.USE_PROXY ? {
                    "protocol": "http",
                    "host": process.env.PROXY_HOST,
                    "port": process.env.PROXY_PORT,
                    "auth": {
                        "username": process.env.PROXY_USER,
                        "password": process.env.PROXY_PASS
                    }
                } : null
            }
        );

        if (response.status > 299) return res.status(500).json({ error: "Internal server error", success: false });

        res.status(200).json({
            success: true,
        });
        return;
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Internal server error", success: false });
    }
};
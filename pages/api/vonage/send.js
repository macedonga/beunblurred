import axios from "axios";
import { isValidPhoneNumber } from "react-phone-number-input";

export default async function handler(req, res) {
    try {
        const { phone } = req.body;

        if (!phone) return res.status(400).json({ error: "Missing phone number", success: false });
        if (!isValidPhoneNumber(phone)) return res.status(400).json({ error: "Invalid phone number", success: false });

        const response = await axios.post(
            "https://auth.bereal.team/api/vonage/request-code",
            {
                "phoneNumber": phone,
                "deviceId": Array.from(Array(16), () => Math.floor(Math.random() * 36).toString(36)).join('')
            },
            {
                headers: {
                    "Accept": "*/*",
                    "User-Agent": "BeReal/8586 CFNetwork/1240.0.4 Darwin/20.6.0",
                    "x-ios-bundle-identifier": "AlexisBarreyat.BeReal",
                    "Content-Type": "application/json",
                    "bereal-app-version-code": "14549",
                    "bereal-signature": "MToxNzExNTU5NzM4Os1y+W0KM2Zwwevvjsl3DsUyRkXieKaCdPK127Ub0cfr",
                    "bereal-device-id": "937v3jb942b0h6u9",
                    "bereal-timezone": "Europe/Paris",
                }
            }
        );

        if (response.status !== 200) return res.status(500).json({ error: "Internal server error", success: false });

        res.status(200).json({
            success: true,
            requestId: response.data.vonageRequestId
        });
        return;
    } catch (error) {
        console.log(error.response.data, error.stack)
        return res.status(500).json({ error: "Internal server error", success: false });
    }
};
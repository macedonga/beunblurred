import axios from "axios";
import { serialize } from "cookie";
import { setCookie } from "cookies-next";
import { fetchSignature } from "@/utils/requests";

const FIREBASE_API_KEY = "AIzaSyCgNTZt6gzPMh-2voYXOvrt_UR_gpGl83Q";
const ArkoseKey = "CCB0863E-D45D-42E9-A6C8-9E8544E8B17E";
const BeRealClientSecret = "F5A71DA-32C7-425C-A3E3-375B4DACA406";

export default async function handler(req, res) {
    const { otp, phoneNumber } = req.body;

    try {
        const response = await axios.post(
            "https://auth-l7.bereal.com/token/phone",
            {
                "client_id": "android",
                "client_secret": BeRealClientSecret,
                "code": otp,
                "device_id": "937v3jb942b0h6u9",
                "phone_number": phoneNumber
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

        const berealAccessToken = response.data.access_token;
        const refreshToken = response.data.refresh_token;
        const tokenType = response.data.token_type;
        const expiresIn = response.data.expires_in;
        const expires = Date.now() + expiresIn * 1000;

        const setCookieOptions = {
            req,
            res,
            maxAge: 60 * 60 * 24 * 7 * 3600,
            path: "/",
        };

        setCookie("token", berealAccessToken, setCookieOptions);
        setCookie("refreshToken", refreshToken, setCookieOptions);
        setCookie("tokenType", tokenType, setCookieOptions);
        setCookie("tokenExpiration", Date.now() + (expires * 1000), setCookieOptions);

        const reqOptions = { "headers": { "Authorization": `Bearer ${berealAccessToken}`, } };
        const userResponse = await axios.get("https://mobile.bereal.com/api/person/me", reqOptions);
        setCookie("user", JSON.stringify(userResponse.data), setCookieOptions);

        res.status(200).json({
            success: true,
        });
    } catch (e) {
        console.log(e)
        const errorCodes = {
            "INVALID_CODE": "The code is incorrect.",
            "SESSION_EXPIRED": "The SMS code has expired. Please re-send the verification code to try again.",
        };

        return res.status(500).json({
            error: errorCodes[e?.response?.data?.error?.message] || "Internal server error",
            code: e?.response?.data?.error?.message || "SERVER_ERROR",
            success: false
        });
    }
};
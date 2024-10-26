import axios from "axios";
import { getCookie, setCookie } from "cookies-next";

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const fetchSignature = async (i = 0) => {
    try {
        const res = await axios.get("https://sig.beunblurred.co/get?token=sOWSRnugxI");
        return res.data;
    } catch (e) {
        if (i < 3) {
            await sleep(250);
            return await fetchSignature(i + 1);
        } else {
            throw e;
        }
    }
};

const requestAuthenticated = async (endpoint, request, response, method = "get", body = null, idx = 0) => {
    try {
        const data = [];
        const requiredCookies = [
            "token",
            "refreshToken",
            "tokenType",
            "tokenExpiration",
        ];

        for (const cookie of requiredCookies) {
            data[cookie] = request.cookies[cookie];
        }
        let SIGNATURE = await fetchSignature();

        const options = {
            "headers": {
                "User-Agent": "BeReal/3.10.1 (com.bereal.ft; build:2348592; Android 14) 4.12.0/OkHttp",
                "x-ios-bundle-identifier": "AlexisBarreyat.BeReal",
                "Authorization": `Bearer ${data.token}`,
                "bereal-app-version-code": "2348592",
                "bereal-app-version": "3.10.1",
                "bereal-signature": SIGNATURE,
                "bereal-device-id": "937v3jb942b0h6u9",
                "bereal-timezone": "Europe/Paris",
            }
        };

        try {
            const res = await axios({
                "method": method,
                "url": "https://mobile.bereal.com/api/" + endpoint,
                "headers": options.headers,
                "data": body
            });

            return res;
        } catch (e) {
            if (process.env.NODE_ENV === "development") {
                console.error(e?.response?.data);
            }

            // deepcode ignore HardcodedNonCryptoSecret
            const refreshData = await axios.post(
                "https://auth-l7.bereal.com/token?grant_type=refresh_token",
                {
                    "grant_type": "refresh_token",
                    "client_id": "android",
                    "client_secret": "F5A71DA-32C7-425C-A3E3-375B4DACA406",
                    "refresh_token": data.refreshToken
                },
                {
                    "headers": {
                        "Accept": "*/*",
                        "User-Agent": "BeReal/3.10.1 (com.bereal.ft; build:2348592; Android 14) 4.12.0/OkHttp",
                        "x-ios-bundle-identifier": "AlexisBarreyat.BeReal",
                        "Content-Type": "application/json",
                        "bereal-app-version-code": "2348592",
                        "bereal-app-version": "3.10.1",
                        "bereal-signature": SIGNATURE,
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

            const setCookieOptions = {
                req: request,
                res: response,
                maxAge: 60 * 60 * 24 * 7 * 3600,
                path: "/",
            };

            setCookie("token", refreshData.data.access_token, setCookieOptions);
            setCookie("refreshToken", refreshData.data.refresh_token, setCookieOptions);
            setCookie("tokenExpiration", Date.now() + (refreshData.data.expires_in * 1000), setCookieOptions);
            request.cookies = {
                ...request.cookies,
                token: refreshData.data.access_token,
                refreshToken: refreshData.data.refresh_token
            };

            options.headers["Authorization"] = `Bearer ${refreshData.data.access_token}`;

            const res = await axios.get("https://mobile.bereal.com/api/" + endpoint, options);

            return {
                ...res,
                refreshedToken: true,
                token: refreshData.data.access_token,
                refreshToken: refreshData.data.refresh_token
            };
        }
    } catch (e) {
        if (idx == 3)
            throw e;

        await sleep(250);

        console.log(`[${new Date().toLocaleTimeString()}](${idx}) - Retrying request to ${endpoint}...`);
        return requestAuthenticated(endpoint, request, response, method, body, idx + 1);
    }
};

export {
    fetchSignature,
    requestAuthenticated
}
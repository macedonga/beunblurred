import axios from "axios";
import { getCookie, setCookie } from "cookies-next";

const fetchSignature = async () => {
    const res = await axios.get("https://sig.beunblurred.co/get?token=i1w3j4DHDDS82j12");
    return res.data;
};

const requestAuthenticated = async (endpoint, request, response) => {
    const data = [];
    const requiredCookies = [
        "token",
        "refreshToken",
        "tokenType",
        "tokenExpiration",
    ];

    requiredCookies.forEach(n => data[n] = getCookie(n, { req: request, res: response }));
    let SIGNATURE = await fetchSignature();

    const options = {
        "headers": {
            "Authorization": `Bearer ${data.token}`,
            "bereal-app-version-code": "14549",
            "bereal-signature": SIGNATURE,
            "bereal-device-id": "937v3jb942b0h6u9",
            "bereal-timezone": "Europe/Paris",
        }
    };

    try {
        const res = await axios.get("https://mobile.bereal.com/api/" + endpoint, options);

        return res;
    } catch (e) {
        // deepcode ignore HardcodedNonCryptoSecret
        const refreshData = await axios.post(
            "https://auth.bereal.team/token?grant_type=refresh_token",
            {
                "grant_type": "refresh_token",
                "client_id": "ios",
                "client_secret": "962D357B-B134-4AB6-8F53-BEA2B7255420",
                "refresh_token": data.refreshToken
            },
            {
                "headers": {
                    "Accept": "*/*",
                    "User-Agent": "BeReal/8586 CFNetwork/1240.0.4 Darwin/20.6.0",
                    "x-ios-bundle-identifier": "AlexisBarreyat.BeReal",
                    "Content-Type": "application/json",
                    "bereal-app-version-code": "14549",
                    "bereal-signature": SIGNATURE,
                    "bereal-device-id": "937v3jb942b0h6u9",
                    "bereal-timezone": "Europe/Paris",
                }
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

        options["Authorization"] = `Bearer ${refreshData.data.access_token}`;

        const res = await axios.get("https://mobile.bereal.com/api/" + endpoint, options);

        return res;
    }
};

export {
    fetchSignature,
    requestAuthenticated
}
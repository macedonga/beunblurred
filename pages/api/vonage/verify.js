import axios from "axios";
import { serialize } from "cookie";
import { setCookie } from "cookies-next";

const FIREBASE_API_KEY = "AIzaSyDwjfEeparokD7sXPVQli9NsTuhT6fJ6iA";

export default async function handler(req, res) {
    const { otp, requestId } = req.body;

    try {
        const response = await axios.post(
            "https://auth.bereal.team/api/vonage/check-code",
            {
                "code": otp,
                "vonageRequestId": requestId
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

        if (response.status > 350 || response.status == 16) {
            return res.status(500).json({ error: "Internal server error", success: false });
        }

        let rstatus = response.data.status;
        let token = response.data.token;
        let uid = response.data.uid;

        const refresh_response = await axios.post(
            "https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyCustomToken?key=" + FIREBASE_API_KEY,
            {
                "token": token,
                "returnSecureToken": "True"
            },
            {
                headers: {
                    "Accept": "*/*",
                    "User-Agent": "BeReal/8586 CFNetwork/1240.0.4 Darwin/20.6.0",
                    "x-ios-bundle-identifier": "AlexisBarreyat.BeReal",
                    "Content-Type": "application/json"
                }
            }
        );

        let id_token = refresh_response.data.idToken;
        let refresh_token = refresh_response.data.refreshToken;
        let expires_in = refresh_response.data.expiresIn;
        let is_new_user = refresh_response.data.isNewUser;

        const firebase_refresh_response = await axios.post(
            "https://securetoken.googleapis.com/v1/token?key=" + FIREBASE_API_KEY,
            {
                "grantType": "refresh_token",
                "refreshToken": refresh_token
            },
            {
                headers: {
                    "Accept": "*/*",
                    "User-Agent": "BeReal/8586 CFNetwork/1240.0.4 Darwin/20.6.0",
                    "x-ios-bundle-identifier": "AlexisBarreyat.BeReal",
                    "Content-Type": "application/json"
                }
            }
        );

        if (firebase_refresh_response.status > 350 || firebase_refresh_response.status == 16) {
            return res.status(500).json({ error: "Internal server error", success: false });
        }

        let firebase_token = firebase_refresh_response.data.id_token;
        let firebase_refresh_token = firebase_refresh_response.data.refresh_token;
        let user_id = firebase_refresh_response.data.user_id;
        let firebase_expiration = Date.now() + firebase_refresh_response.data.expires_in * 1000;

        // deepcode ignore HardcodedNonCryptoSecret
        const access_grant_response = await axios.post(
            "https://auth.bereal.team/token?grant_type=firebase",
            {
                "grant_type": "firebase",
                "client_id": "ios",
                "client_secret": "962D357B-B134-4AB6-8F53-BEA2B7255420",
                "token": firebase_token
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

        if (access_grant_response.status > 350 || access_grant_response.status == 16) {
            res.status(400).json({ status: access_grant_response });
            return;
        }

        const setCookieOptions = {
            req,
            res,
            maxAge: 60 * 60 * 24 * 7 * 3600,
            path: "/",
        };

        setCookie("token", access_grant_response.data.access_token, setCookieOptions);
        setCookie("refreshToken", access_grant_response.data.refresh_token, setCookieOptions);
        setCookie("tokenType", access_grant_response.data.token_type, setCookieOptions);
        setCookie("tokenExpiration", Date.now() + (access_grant_response.data.expires_in * 1000), setCookieOptions);

        const reqOptions = { "headers": { "Authorization": `Bearer ${access_grant_response.data.access_token}`, } };
        const userResponse = await axios.get("https://mobile.bereal.com/api/person/me", reqOptions);
        setCookie("user", JSON.stringify(userResponse.data), setCookieOptions);

        res.status(200).json({
            success: true,
        });
    } catch (e) {
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
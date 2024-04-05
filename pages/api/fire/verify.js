import axios from "axios";
import { serialize } from "cookie";
import { setCookie } from "cookies-next";
import { fetchSignature } from "@/utils/requests";

const FIREBASE_API_KEY = "AIzaSyDwjfEeparokD7sXPVQli9NsTuhT6fJ6iA";

export default async function handler(req, res) {
    const { otp, requestId } = req.body;

    try {
        let fire_otp_response = await axios.post(
            "https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPhoneNumber?key=" + FIREBASE_API_KEY,
            {
                "code": otp,
                "sessionInfo": requestId,
                "operation": "SIGN_UP_OR_IN"
            },
            {
                "headers": {
                    "content-type": "application/json",
                    "accept": "*/*",
                    "x-client-version": "iOS/FirebaseSDK/9.6.0/FirebaseCore-iOS",
                    "x-ios-bundle-identifier": "AlexisBarreyat.BeReal",
                    "accept-language": "en",
                    "user-agent": "FirebaseAuth.iOS/9.6.0 AlexisBarreyat.BeReal/0.31.0 iPhone/14.7.1 hw/iPhone9_1",
                    "x-firebase-locale": "en",
                    "x-firebase-gmpid": "1:405768487586:ios:28c4df089ca92b89",
                }
            }
        );

        let fire_refresh_token = fire_otp_response.data.refreshToken;
        let is_new_user = fire_otp_response.data.isNewUser;
        let uid = fire_otp_response.data.localId;

        let firebase_refresh_response = await axios.post(
            "https://securetoken.googleapis.com/v1/token?key=" + FIREBASE_API_KEY,
            {
                "grantType": "refresh_token",
                "refreshToken": fire_refresh_token
            },
            {
                "headers": {
                    "Accept": "application/json",
                    "User-Agent": "BeReal/8586 CFNetwork/1240.0.4 Darwin/20.6.0",
                    "x-ios-bundle-identifier": "AlexisBarreyat.BeReal",
                    "Content-Type": "application/json"
                }
            }
        );

        let firebase_token = firebase_refresh_response.data.id_token;
        let firebase_refresh_token = firebase_refresh_response.data.refresh_token;
        let user_id = firebase_refresh_response.data.user_id;
        let firebase_expiration = Date.now() + firebase_refresh_response.data.expires_in * 1000;

        // deepcode ignore HardcodedNonCryptoSecret
        let access_grant_response = await axios.post(
            "https://auth.bereal.team/token?grant_type=firebase",
            {
                "grant_type": "firebase",
                "client_id": "ios",
                "client_secret": "962D357B-B134-4AB6-8F53-BEA2B7255420",
                "token": firebase_token
            },
            {
                "headers": {
                    "Accept": "application/json",
                    "User-Agent": "BeReal/8586 CFNetwork/1240.0.4 Darwin/20.6.0",
                    "x-ios-bundle-identifier": "AlexisBarreyat.BeReal",
                    "Content-Type": "application/json",
                    "bereal-app-version-code": "14549",
                    "bereal-signature": (await fetchSignature()),
                    "bereal-device-id": "937v3jb942b0h6u9",
                    "bereal-timezone": "Europe/Paris",
                }
            }
        );

        let access_token = access_grant_response.data.access_token;
        let access_refresh_token = access_grant_response.data.refresh_token;
        let access_token_type = access_grant_response.data.token_type;
        let access_expiration = Date.now() + (Number(access_grant_response.data.expires_in) * 1000);

        const setCookieOptions = {
            req,
            res,
            maxAge: 60 * 60 * 24 * 7 * 3600,
            path: "/",
        };

        setCookie("token", access_token, setCookieOptions);
        setCookie("refreshToken", access_refresh_token, setCookieOptions);
        setCookie("tokenType", access_token_type, setCookieOptions);
        setCookie("tokenExpiration", Date.now() + (access_expiration * 1000), setCookieOptions);

        const reqOptions = {
            "headers": {
                "Authorization": `Bearer ${access_token}`,
                "bereal-app-version-code": "14549",
                "bereal-signature": (await fetchSignature()),
                "bereal-device-id": "937v3jb942b0h6u9",
                "bereal-timezone": "Europe/Paris",
            }
        };
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
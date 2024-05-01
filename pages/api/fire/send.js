import axios from "axios";
import { isValidPhoneNumber } from "react-phone-number-input";

import { fetchSignature } from "@/utils/requests";

export default async function handler(req, res) {
    try {
        const { phone } = req.body;

        if (!phone) return res.status(400).json({ error: "Missing phone number", success: false });
        if (!isValidPhoneNumber(phone)) return res.status(400).json({ error: "Invalid phone number", success: false });

        let receipt_response = await axios.post(
            "https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyClient?key=AIzaSyDwjfEeparokD7sXPVQli9NsTuhT6fJ6iA",
            { "appToken": "54F80A258C35A916B38A3AD83CA5DDD48A44BFE2461F90831E0F97EBA4BB2EC7" },
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
                    "bereal-app-version-code": "14549",
                    "bereal-signature": (await fetchSignature()),
                    "bereal-device-id": "937v3jb942b0h6u9",
                    "bereal-timezone": "Europe/Paris",
                }
            },
        );
        let receipt = receipt_response.data.receipt;

        const response = await axios.post(
            "https://www.googleapis.com/identitytoolkit/v3/relyingparty/sendVerificationCode?key=AIzaSyDwjfEeparokD7sXPVQli9NsTuhT6fJ6iA",
            {
                "phoneNumber": phone,
                "iosReceipt": receipt,
            },
            {
                "headers": {
                    "content-type": "application/json",
                    "accept": "*/*",
                    "x-client-version": "iOS/FirebaseSDK/9.6.0/FirebaseCore-iOS",
                    "x-ios-bundle-identifier": "AlexisBarreyat.BeReal",
                    "accept-language": "en",
                    "user-agent": "FirebaseAuth.iOS/9.6.0 AlexisBarreyat.BeReal/0.28.2 iPhone/14.7.1 hw/iPhone9_1",
                    "x-firebase-locale": "en",
                    "x-firebase-gmpid": "1:405768487586:ios:28c4df089ca92b89",
                    "bereal-app-version-code": "14549",
                    "bereal-signature": (await fetchSignature()),
                    "bereal-device-id": "937v3jb942b0h6u9",
                    "bereal-timezone": "Europe/Paris",
                }
            }
        );

        if (response.status !== 200) return res.status(500).json({ error: "Internal server error", success: false });

        res.status(200).json({
            success: true,
            requestId: response.data.sessionInfo
        });
        return;
    } catch (error) {
        return res.status(500).json({ error: "Internal server error", success: false });
    }
};
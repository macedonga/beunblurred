const axios = require("axios");

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

const requestAuthenticated = async (endpoint, data, idx = 0) => {
    try {
        var SIGNATURE = await fetchSignature();
    } catch (e) {
        return {
            res: null,
            error: 2
        }
    }

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

        return {
            res,
            refreshed: false
        };
    } catch (e) {
        try {
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

            options.headers["Authorization"] = `Bearer ${refreshData.data.access_token}`;

            const res = await axios.get("https://mobile.bereal.com/api/" + endpoint, options);

            return {
                res,
                token: refreshData.data.access_token,
                refreshToken: refreshData.data.refresh_token,
                refreshed: true
            };
        } catch {
            if (idx == 3) {
                return {
                    res: null,
                    error: 1
                };
            }

            console.log(`[${new Date().toLocaleTimeString()}](${idx}) - Retrying request to ${endpoint}...`);
            await sleep(250);

            return requestAuthenticated(endpoint, data, idx + 1);
        }
    }
};

module.exports = {
    fetchSignature,
    requestAuthenticated
}
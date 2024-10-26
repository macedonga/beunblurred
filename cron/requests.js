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
        const res = await axios.get("https://mobile.bereal.com/api/" + endpoint, options);

        return {
            res,
            refreshed: false
        };
    } catch (e) {
        try {
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
import axios from "axios";

export default async function handler(req, res) {
    const { endpoint } = req.query;

    if (!endpoint || typeof endpoint !== "string") {
        return res.status(400).json({
            error: "Endpoint parameter is required",
            success: false,
        });
    }

    const regexPattern = "^https:\/\/cdn([a-z0-9-]+)?\.bereal\.network\/.*";
    const regex = new RegExp(regexPattern);

    if (!regex.test(endpoint.toString())) {
        return res.status(400).json({
            error: "Invalid URL",
            success: false,
        });
    }

    try {
        const filterProperties = (raw, unallowed) => Object.keys(raw)
            .filter((key) => !unallowed.includes(key))
            .reduce((obj, key) => {
                obj[key] = raw[key];
                return obj;
            }, {});

        const endpointReq = await axios({
            // deepcode ignore Ssrf
            url: endpoint,
            responseType: "arraybuffer",
            method: "get",
            headers: {
                "X-Requested-With": "XMLHttpRequest",
            },
            params: filterProperties({ ...req.query }, ["endpoint"]),
        });
        const endpointRes = await endpointReq.data;

        res.setHeader("Content-Type", "image/webp");
        // deepcode ignore XSS
        return res.send(endpointRes);
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: "Unknown error",
            success: false,
        });
    }
};

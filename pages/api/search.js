import { hasCookie } from "cookies-next";
import Stripe from "stripe";

import { requestAuthenticated } from "@/utils/requests";
import checkAuth from "@/utils/checkAuth";
import clientPromise from "@/utils/mongo";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method Not Allowed",
            success: false
        });
    }

    if (!req.query.q || req.query.q.length < 3) {
        return res.status(400).json({
            error: "Bad Request",
            success: false
        });
    }

    const authCheck = await checkAuth(req, res);
    if (authCheck) {
        return res.status(401).json({
            error: "Unauthorized",
            success: false
        });
    }

    const response = await (requestAuthenticated("search/profile?query=" + req.query.q, req, res).then(r => r.data.data));

    return res.status(200).json({
        data: response,
        success: true
    });
};
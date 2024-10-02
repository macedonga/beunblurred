import checkAuth from "@/utils/checkAuth";
import { requestAuthenticated } from "@/utils/requests";

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const authCheck = await checkAuth(req, res);
    if (authCheck) {
        return res.status(401).json({
            error: "Unauthorized",
            success: false
        });
    }

    const requiredFields = ["userId"];

    if (!requiredFields.every(field => Object.keys(req.body).includes(field)))
        return res.status(400).json({ error: "Missing data: userId is a required field.", success: false });

    if (typeof req.body.userId !== "string")
        return res.status(400).json({ error: "Invalid data: userId must be a string.", success: false });

    if (req.body.userId.length === 0)
        return res.status(400).json({ error: "Invalid data: userId cannot be an empty string.", success: false });

    if (req.body.userId.length > 255)
        return res.status(400).json({ error: "Invalid data: userId cannot be longer than 255 characters.", success: false });

    try {
        const data = await requestAuthenticated("relationships/friend-requests", req, res, "POST", {
            "userId": req.body.userId
        }).then(res => res.data);

        return res.status(200).json({
            success: true,
            data
        });
    } catch (e) {
        return res.status(500).json({
            error: "An error occurred while trying to add the user as a friend. Please try again later.",
            success: false
        });
    }
};
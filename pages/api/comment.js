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

    const requiredFields = ["postId", "postUserId", "comment"];

    if (!requiredFields.every(field => Object.keys(req.body).includes(field)))
        return res.status(400).json({ error: "Missing data: postId, postUserId and comment are required fields.", success: false });

    try {
        let response = await requestAuthenticated(`content/comments?postId=${req.body.postId}&postUserId=${req.body.postUserId}`, req, res, "post", {
            content: req.body.comment,
        });

        return res.status(200).json({
            success: true
        });
    } catch (e) {
        return res.status(500).json({
            error: "An error occurred while trying to post the comment. Please try again later.",
            success: false
        });
    }
};
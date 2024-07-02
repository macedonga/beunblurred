import jwt from "jsonwebtoken";
import checkAuth from "@/utils/checkAuth";
import clientPromise from "@/utils/mongo";

export default async function handler(req, res) {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

    const client = await clientPromise;
    const db = await client.db("beunblurred");
    const users = await db.collection("users");

    const token = req.cookies.archiverToken;

    const isLoggedin = await checkAuth(req, res);
    if (isLoggedin) return res.status(401).json({ error: "Unauthorized", success: false });
    const { id } = jwt.decode(token, process.env.SIGNATURE_SECRET);

    const user = await users.findOne({ id });
    if (!user) return res.status(400).json({ error: "User does not exist.", success: false });

    user.enabled = !user.enabled;

    await users.updateOne({ id }, {
        $set: {
            enabled: user.enabled,
        },
    });

    return res.status(200).json({
        success: true,
        enabled: user.enabled,
    });
}
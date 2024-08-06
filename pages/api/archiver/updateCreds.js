import { requestAuthenticated } from "@/utils/requests";
import clientPromise from "@/utils/mongo";
import checkAuth from "@/utils/checkAuth";
import { getCookie } from "cookies-next";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const client = await clientPromise;
    const db = client.db("beunblurred");
    const users = db.collection("users");

    const authCheck = await checkAuth(req, res);
    if (authCheck) return res.status(401).json({ message: "Unauthorized" });

    const user = await requestAuthenticated("person/me", req, res);

    const userFromDb = await users.findOne({ id: user.data.id });

    if (!userFromDb) {
        return res.status(404).json({ message: "User not found" });
    }

    if (!userFromDb.paid) {
        await users.updateOne(
            { id: user.data.id },
            { $set: { active: false } }
        );
        return res.status(400).json({ message: "Subscription not active" });
    }

    if (!userFromDb.shouldUpdateCredentials) {
        return res.status(400).json({ message: "No need to update credentials" });
    }

    await users.updateOne(
        { id: user.data.id },
        {
            $set: {
                token: getCookie("token", { req, res }),
                refreshToken: getCookie("refreshToken", { req, res }),
                shouldUpdateCredentials: false
            }
        }
    );
    res.status(200).json({ message: "Success" });
}
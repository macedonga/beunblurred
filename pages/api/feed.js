import { hasCookie } from "cookies-next";

import { requestAuthenticated } from "@/utils/requests";
import checkAuth from "@/utils/checkAuth";
import clientPromise from "@/utils/mongo";

export default async function handler(req, res) {
    const authCheck = await checkAuth(req, res);
    if (authCheck) {
        return res.status(401).json({
            error: "Unauthorized",
            success: false
        });
    }

    const feedResponse = await requestAuthenticated("feeds/friends-v1", req, res).then(res => res.data);
    const user = await requestAuthenticated("person/me", req, res);

    const client = await clientPromise;
    const db = client.db("beunblurred");
    const users = db.collection("users");

    const userFromDb = await users.findOne({ id: user.data.id });

    return res.status(200).json({
        ...feedResponse,
        friendsPosts: feedResponse.friendsPosts.reverse(),
        showUpdateCredsAlert: userFromDb?.shouldUpdateCredentials
    });
};
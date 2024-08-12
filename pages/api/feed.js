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

    const feedResponse = await requestAuthenticated("feeds/friends-v1", req, res);
    if (feedResponse.refreshedToken) {
        req.cookies["token"] = feedResponse.token;
        req.cookies["refreshToken"] = feedResponse.refreshToken;
    }
    
    const user = await requestAuthenticated("person/me", req, res).then(res => res.data);

    const client = await clientPromise;
    const db = client.db("beunblurred");
    const users = db.collection("users");

    const userFromDb = await users.findOne({ id: user?.id });

    return res.status(200).json({
        ...feedResponse.data,
        friendsPosts: feedResponse.data.friendsPosts.reverse(),
        showUpdateCredsAlert: userFromDb?.shouldUpdateCredentials
    });
};
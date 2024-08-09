import checkAuth from "@/utils/checkAuth";
import { requestAuthenticated } from "@/utils/requests";
import { hasCookie } from "cookies-next";

export default async function handler(req, res) {
    const authCheck = await checkAuth(req, res);
    if (authCheck) {
        return res.status(401).json({
            error: "Unauthorized",
            success: false
        });
    }

    const feedResponse = await requestAuthenticated("feeds/friends-v1", req, res).then(res => res.data);;

    return res.status(200).json({
        ...feedResponse,
        friendsPosts: feedResponse.friendsPosts.reverse()
    });
};
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

    let feedResponse = {
        data: {
            data: [],
            next: null
        }
    };

    if (!hasCookie("testMode", { req, res })) {
        let nextToken = req.query.next || null;
        feedResponse = await requestAuthenticated("feeds/friends-of-friends" + (nextToken ? ("?page=" + nextToken) : ""), req, res);
    }

    return res.status(200).json({
        data: feedResponse.data.data.map(p => ({
            posts: [
                {
                    primary: p.primary,
                    takenAt: p.takenAt,
                    secondary: p.secondary,
                    id: p.moment.id,
                    location: p.location,
                    lateInSeconds: p.lateInSeconds,
                    realmojis: p.realmojis,
                    caption: p.caption,
                    isLate: p.lateInSeconds > 0,
                }
            ],
            ...p
        })),
        next: feedResponse.data.next,
        success: true
    });
};
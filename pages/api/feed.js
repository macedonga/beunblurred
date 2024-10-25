import { hasCookie } from "cookies-next";
import Stripe from "stripe";

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

    let friendsPosts = feedResponse.data.friendsPosts.reverse();

    if (!process.env.NEXT_PUBLIC_NO_ARCHIVER) {
        const client = await clientPromise;
        const db = client.db("beunblurred");
        const users = db.collection("users");
        const posts = db.collection("posts");

        var userFromDb = await users.findOne({ id: user?.id });

        var showPaymentError = false;
        if (userFromDb) {
            const stripe = Stripe(process.env.STRIPE_API_KEY);
            const customer = await stripe.customers.retrieve(userFromDb.stripeCustomerId, {
                expand: ["subscriptions"],
            });
            showPaymentError = customer.subscriptions?.data?.length == 0 || customer.subscriptions?.data[0]?.status !== "active" || userFromDb.showPaymentError;

            let queries = {
                id: { $in: friendsPosts.map(p => p.momentId) },
                uid: { $in: friendsPosts.map(p => p.user.id) }
            };

            const results = (await posts.find(queries).toArray()).map(p => ({ id: p.id, uid: p.uid }));
            for (const result of results) {
                let idx = friendsPosts.findIndex(p => p.momentId === result.id && p.user.id === result.uid);
                if (friendsPosts[idx]) friendsPosts[idx].archived = true;
            }
        }
    }

    return res.status(200).json({
        ...feedResponse.data,
        friendsPosts,
        showUpdateCredsAlert: userFromDb?.shouldUpdateCredentials,
        showPaymentError,
        showAds: !(userFromDb?.paid && userFromDb?.active) && !process.env.NEXT_PUBLIC_NO_ARCHIVER,
        // showAds: true,
    });
};
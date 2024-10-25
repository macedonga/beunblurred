import { requestAuthenticated } from "@/utils/requests";
import clientPromise from "@/utils/mongo";
import checkAuth from "@/utils/checkAuth";
import Stripe from "stripe";

import { getCookie } from "cookies-next";

export default async function handler(req, res) {
    if (process.env.NEXT_PUBLIC_NO_ARCHIVER) return res.status(400).json({ error: "Archiver not enabled." });

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
        return res.status(404).json({ message: "User doesn't exist" });
    }

    const stripe = Stripe(process.env.STRIPE_API_KEY);
    const customer = await stripe.customers.retrieve(userFromDb.stripeCustomerId, {
        expand: ["subscriptions"],
    });

    if (customer.subscriptions?.data?.length == 0) {
        const session = await stripe.checkout.sessions.create({
            customer: userFromDb.stripeCustomerId,
            line_items: [
                {
                    price: process.env.STRIPE_PRODUCT_ID,
                    quantity: 1,
                },
            ],
            mode: "subscription",
            allow_promotion_codes: true,
            success_url: "https://www.beunblurred.co/archiver/load",
            cancel_url: "https://www.beunblurred.co/archiver",
        });
        res.status(200).redirect(session.url);
    } else {
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: userFromDb.stripeCustomerId,
            return_url: "https://www.beunblurred.co/archiver",
        });

        res.status(200).redirect(portalSession.url);
    }
}
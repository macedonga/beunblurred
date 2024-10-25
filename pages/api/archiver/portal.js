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
        return res.status(404).json({ message: "User does not exist" });
    }

    const stripe = Stripe(process.env.STRIPE_API_KEY);
    const portalSession = await stripe.billingPortal.sessions.create({
        customer: userFromDb.stripeCustomerId,
        return_url: "https://www.beunblurred.co/archiver",
    });

    res.status(200).redirect(portalSession.url);
}
import Stripe from "stripe";
import { buffer } from "micro";
import clientPromise from "@/utils/mongo";

const stripe = Stripe(process.env.STRIPE_API_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export default async function handler(req, res) {
    if (process.env.NEXT_PUBLIC_NO_ARCHIVER) return res.status(400).json({ error: "Archiver not enabled." });
    
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const sig = req.headers['stripe-signature'];
    let event;
    try {
        const buf = await buffer(req);
        event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } catch (err) {
        const errorMessage = err.message || 'Unknown error';
        // deepcode ignore XSS: handled by stripe
        res.status(400).send(`Webhook Error: ${errorMessage}`)
        return
    }

    if (!event.data.object.customer) return;

    const client = await clientPromise;
    const db = client.db("beunblurred");
    const users = db.collection("users");
    const user = users.findOne({
        stripeCustomerId: event.data.object.customer
    });

    if (event.type === 'invoice.paid') {
        if (event.data.object.billing_reason == "subscription_create") {
            // new subscription
            await users.updateOne({ id: user.id }, { $set: { active: true, paid: true } });
        }
    } else if (event.type === "customer.subscription.deleted") {
        // deleted subscription
        await users.updateOne({ id: user.id }, { $set: { active: false, paid: false, subscriptionId: null } });
    } else if (event.type === "invoice.payment_failed") {
        await users.updateOne({ id: user.id }, { $set: { active: false, paid: false, showPaymentError: true } });
    }

    res.json({ received: true })
};

export const config = {
    api: {
        bodyParser: false,
    },
};
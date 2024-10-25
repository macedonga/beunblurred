import { getCookie, hasCookie, deleteCookie, setCookie } from "cookies-next";
import { requestAuthenticated } from "@/utils/requests";
import clientPromise from "@/utils/mongo";
import checkAuth from "@/utils/checkAuth";
import Stripe from "stripe";

export default function LoadSubscription() {
    return (<></>);
};

export async function getServerSideProps({ req, res }) {
    const authCheck = await checkAuth(req, res);
    if (authCheck) return authCheck;
    
    if (process.env.NEXT_PUBLIC_NO_ARCHIVER) {
        return {
            redirect: {
                destination: "/feed",
                permanent: false
            }
        };
    }

    const user = await requestAuthenticated("person/me", req, res);

    const db = (await clientPromise).db();
    const users = db.collection("users");
    const posts = db.collection("posts");

    const userFromDb = await users.findOne({ id: user.data.id });

    if (!userFromDb) {
        return {
            redirect: {
                destination: "/archiver/signup",
                permanent: false
            }
        };
    }

    const stripe = Stripe(process.env.STRIPE_API_KEY);
    const customer = await stripe.customers.retrieve(userFromDb.stripeCustomerId, {
        expand: ["subscriptions"],
    });

    if (customer.subscriptions?.data?.length == 0 || customer.subscriptions?.data[0]?.status !== "active") {
        return {
            redirect: {
                destination: "/archiver",
                permanent: false
            }
        };
    } else {
        await users.updateOne({ id: user.data.id }, {
            $set: {
                active: true,
                paid: true
            }
        });

        return {
            redirect: {
                destination: "/archiver",
                permanent: false
            }
        };
    }
}
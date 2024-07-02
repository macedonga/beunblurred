import jwt from "jsonwebtoken";
import checkAuth from "@/utils/checkAuth";
import { requestAuthenticated } from "@/utils/requests";
import clientPromise from "@/utils/mongo";

export default async function handler(req, res) {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

    const client = await clientPromise;
    const db = await client.db("beunblurred");
    const users = await db.collection("users");

    const isLoggedin = await checkAuth(req, res);
    if (isLoggedin) return res.status(401).json({ error: "Unauthorized", success: false });

    const { data } = await requestAuthenticated("person/me", req, res);
    const { id } = data;

    const user = await users.findOne({ id });

    if (user) return res.status(400).json({ error: "User already exists.", success: false });

    const newUser = {
        id,
        signupDate: new Date(),
        enabled: false,
        users: [],
    };

    await users.insertOne(newUser);

    const token = jwt.sign({ id }, process.env.SIGNATURE_SECRET);

    return res.status(200).json({
        success: true,
        token,
    });
}
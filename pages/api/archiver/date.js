import { requestAuthenticated } from "@/utils/requests";
import clientPromise from "@/utils/mongo";
import checkAuth from "@/utils/checkAuth";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { date } = req.query;

    if (!date) {
        return res.status(400).json({ message: "Missing date" });
    }

    try {
        const dateObj = new Date(date);
    } catch (e) {
        return res.status(400).json({ message: "Invalid date" });
    }

    const client = await clientPromise;
    const db = client.db("beunblurred");
    const users = db.collection("users");
    const posts = db.collection("posts");

    const authCheck = await checkAuth(req, res);
    if (authCheck) return res.status(401).json({ message: "Unauthorized" });

    const user = await requestAuthenticated("person/me", req, res);

    const userFromDb = await users.findOne({ id: user.data.id });

    if (!userFromDb) {
        return res.status(404).json({ message: "User not found" });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const postsFromDb = await posts.find({
        for: {
            $in: [user.data.id]
        },
        date: {
            $gte: startOfDay,
            $lt: endOfDay
        }
    })
        .toArray();

    let returnPosts = [];

    for (const post of postsFromDb) {
        delete post.for;
        delete post._id;
        returnPosts.push(post);
    }

    res.status(200).json({ message: "Success", posts: returnPosts });
}
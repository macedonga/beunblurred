import axios from "axios";
import { hasCookie, deleteCookie } from "cookies-next";

export default async (req, res) => {
    const requiredCookies = [
        "token",
        "refreshToken",
        "tokenType",
        "tokenExpiration",
    ];
    const data = [];

    for (const cookie of requiredCookies) {
        data[cookie] = req.cookies[cookie];
    }

    if (Object.keys(data).map(k => data[k]).includes(false)) {
        requiredCookies.forEach(n => deleteCookie(n, { req, res }))
        return {
            redirect: {
                destination: "/",
                permanent: false,
            }
        };
    }

    return null;
};
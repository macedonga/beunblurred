import axios from "axios";
import { useEffect, useState } from "react";
import { getCookie, hasCookie, deleteCookie, setCookie } from "cookies-next";

import PostComponent from "../components/PostComponent";
import { NextSeo } from "next-seo";
import Link from "next/link";

export default function Feed(props) {
    const [Greeting, setGreeting] = useState("Good morning");
    const [Data, setData] = useState({
        ...props.feed,
        friendsPosts: props.feed.friendsPosts.sort((a, b) => {
            return new Date(b.posts[0].takenAt) - new Date(a.posts[0].takenAt);
        })
    });

    useEffect(() => {
        var today = new Date()
        var curHr = today.getHours()
        let greeting;

        if (curHr < 12) greeting = "Good morning";
        else if (curHr < 18) greeting = "Good afternoon";
        else if (curHr < 21) greeting = "Good evening";
        else greeting = "Good night";

        setGreeting(greeting);
    }, []);

    return (<>
        <NextSeo title="Friends - Feed" />

        <div
            className="relative p-4 rounded-lg"
            style={{
                backgroundImage: `url(${props.user.profilePicture?.url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        >
            <div className="backdrop-blur-3xl bg-black/25 absolute inset-0 rounded-lg z-[1]" />
            <div className="z-[2] relative">
                <h1 className="text-xl font-medium">{Greeting} {props.user.fullname || props.user.username}!</h1>
                <p className="text-sm text-white/70">
                    {Data.friendsPosts.length} friends posted a BeReal today.
                </p>
            </div>
        </div>

        <div
            className={"grid lg:gap-y-8 gap-y-4 lg:mt-8 mt-4"}
        >
            {
                Data.friendsPosts.map((friendPost, index) => (
                    <PostComponent
                        key={index}
                        data={friendPost}
                    />
                ))
            }
        </div>
    </>)
}

const fetchData = async (token) => {
    const reqOptions = { "headers": { "Authorization": `Bearer ${token}`, } };
    const feedResponse = await axios.get("https://mobile.bereal.com/api/feeds/friends-v1", reqOptions);
    const userResponse = await axios.get("https://mobile.bereal.com/api/person/me", reqOptions);

    return {
        feed: feedResponse.data,
        user: userResponse.data
    };
};

export async function getServerSideProps({ req, res }) {
    const requiredCookies = [
        "token",
        "refreshToken",
        "tokenType",
        "tokenExpiration"
    ];
    const data = [];

    if (requiredCookies.map(n => hasCookie(n, { req, res })).includes(false)) {
        requiredCookies.forEach(n => deleteCookie(n, { req, res }))
        return {
            redirect: {
                destination: "/",
                permanent: false
            }
        };
    }

    requiredCookies.forEach(n => data[n] = getCookie(n, { req, res }));

    let props;
    try {
        props = await fetchData(data.token);
    } catch (e) {
        console.log(e);
        // deepcode ignore HardcodedNonCryptoSecret
        const refreshData = await axios.post(
            "https://auth.bereal.team/token?grant_type=refresh_token",
            {
                "grant_type": "refresh_token",
                "client_id": "ios",
                "client_secret": "962D357B-B134-4AB6-8F53-BEA2B7255420",
                "refresh_token": data.refreshToken
            },
            {
                headers: {
                    "Accept": "*/*",
                    "User-Agent": "BeReal/8586 CFNetwork/1240.0.4 Darwin/20.6.0",
                    "x-ios-bundle-identifier": "AlexisBarreyat.BeReal",
                    "Content-Type": "application/json"
                }
            }
        );

        const setCookieOptions = {
            req,
            res,
            maxAge: 60 * 60 * 24 * 7 * 3600,
            path: "/",
        };

        setCookie("token", refreshData.data.access_token, setCookieOptions);
        setCookie("refreshToken", refreshData.data.refresh_token, setCookieOptions);
        setCookie("tokenExpiration", Date.now() + (refreshData.data.expires_in * 1000), setCookieOptions);

        data.token = refreshData.data.access_token;
        data.refreshToken = refreshData.data.refresh_token;

        props = await fetchData(data.token);
    }

    return { props };
};
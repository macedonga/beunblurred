import axios from "axios";
import { useEffect, useState } from "react";
import { getCookie, hasCookie, deleteCookie, setCookie } from "cookies-next";

import PostComponent from "../components/PostComponent";
import { NextSeo } from "next-seo";
import Link from "next/link";

export default function Feed(props) {
    const [Greeting, setGreeting] = useState("Good morning");
    const [Data, setData] = useState({});
    const [Loading, setLoading] = useState(false);

    const fetchData = async () => {
        if (Data.next === null && Data.posts.length > 0) return alert("No more posts to load.");
        
        if (Loading) return;
        try {
            setLoading(true);
            const { data } = await axios.get("/api/fof" + (Data.next ? ("?next=" + Data.next) : ""));

            setData(o => {
                let newData = [...(o.posts || []), ...data.data];

                newData = newData.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);

                return {
                    next: data.next,
                    posts: newData.sort((a, b) => {
                        return new Date(b.takenAt) - new Date(a.takenAt);
                    })
                };
            });
            setLoading(false);
        } catch (error) {
            console.log(error);
            setLoading(false);
            alert("An error occurred while fetching FoF feed.");
        }
    };

    useEffect(() => {
        var today = new Date()
        var curHr = today.getHours()
        let greeting;

        if (curHr < 12) greeting = "Good morning";
        else if (curHr < 18) greeting = "Good afternoon";
        else if (curHr < 21) greeting = "Good evening";
        else greeting = "Good night";

        setGreeting(greeting);
        fetchData();
    }, []);

    return (<>
        <NextSeo title="Friends of Friends - Feed" />

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
                    Check out BeReals from your friends of friends.
                </p>
            </div>
        </div>

        <Link
            href="/u/me"
            className={`
                flex bg-white/5 mt-2
                relative border-2 border-white/10
                rounded-lg px-4 py-2 min-w-0 justify-center
                text-white/75 font-medium
            `}
        >
            View your profile
        </Link>

        <div className="flex gap-x-2">
            <Link
                href="/feed"
                className={`
                    flex bg-white/5 mt-2
                    relative border-2 border-white/10
                    rounded-lg px-4 py-2 min-w-0 justify-center
                    text-white/75 font-medium flex-grow
                `}
            >
                View friends feed
            </Link>

            <Link
                href="/discovery"
                className={`
                    flex bg-white/5 mt-2
                    relative border-2 border-white/10
                    rounded-lg px-4 py-2 min-w-0 justify-center
                    text-white/75 font-medium flex-grow
                `}
            >
                View discovery feed
            </Link>
        </div>

        <div
            className={"grid lg:gap-y-8 gap-y-4 lg:mt-8 mt-4"}
        >
            {
                Data.posts?.map((friendPost, index) => (
                    <PostComponent
                        key={index}
                        data={friendPost}
                    />
                ))
            }

            {
                Loading && (
                    <div className="flex justify-center">
                        <div className="w-8 h-8 border-2 border-white/50 rounded-full animate-spin" />
                    </div>
                )
            }

            <button
                onClick={fetchData}
                className={`
                    flex bg-white/5 mt-2
                    relative border-2 border-white/10
                    rounded-lg px-4 py-2 min-w-0 justify-center
                    text-white/75 font-medium
                    disabled:opacity-50
                `}
                disabled={Loading}
            >
                Load more
            </button>
        </div>
    </>)
}

const fetchData = async (token, nextToken) => {
    const reqOptions = { "headers": { "Authorization": `Bearer ${token}`, } };
    const userResponse = await axios.get("https://mobile.bereal.com/api/person/me", reqOptions);

    return {
        user: userResponse.data,
    }
};

export async function getServerSideProps({ req, res, query }) {
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

    return {
        props: JSON.parse(JSON.stringify(props)),
    };
};
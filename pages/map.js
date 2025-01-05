import axios from "axios";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { getCookie, hasCookie, deleteCookie, setCookie } from "cookies-next";

import { requestAuthenticated } from "@/utils/requests";
import { NextSeo } from "next-seo";
import Link from "next/link";
import { T, useTranslate } from "@tolgee/react";
import checkAuth from "@/utils/checkAuth";

const Map = dynamic(() => import("../components/Map"), { ssr: false });
const PostComponent = dynamic(() => import("../components/PostComponent"), {
    loading: () => (
        <div
            className={`
                flex flex-col lg:gap-y-6 gap-y-4
                bg-white/5
                relative border-2 border-white/10
                rounded-lg lg:p-6 p-4 min-w-0
            `}
        >
            <div className="flex justify-center">
                <div className="w-8 h-8 border-2 border-white/50 rounded-full animate-spin" />
            </div>

            <p className="text-xl text-center mt-4">
                <T keyName={"loading"} />
            </p>
        </div>
    ),
    ssr: false,
});

export default function Feed(props) {
    const { t } = useTranslate();
    const [Loading, setLoading] = useState(true);
    const [Greeting, setGreeting] = useState(t("gm"));
    const [FriendsPosts, setFriendsPosts] = useState([]);
    const [Data, setData] = useState();

    const fetchFeed = async () => {
        try {
            setLoading(true);
            const res = await axios.get("/api/feed");
            setData(res.data);
            setFriendsPosts([...res.data.friendsPosts.slice(0, 5)]);
            setLoading(false);
        } catch (e) {
            console.error(e);
            window.location.href = "/500";
        }
    };

    useEffect(() => {
        var today = new Date()
        var curHr = today.getHours()
        let greeting;

        if (curHr < 12) greeting = "gm";
        else if (curHr < 18) greeting = "ga";
        else if (curHr < 21) greeting = "ge";
        else greeting = "gn";

        setGreeting(greeting);
        fetchFeed();
    }, []);

    if (Loading) {
        return (<>
            <div
                className="relative p-4 rounded-lg bg-white/10"
                style={{
                    backgroundImage: `url(/_next/image?url=${props?.user?.profilePicture?.url}&q=1&w=128)`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            >
                <div className="backdrop-blur-3xl bg-black/25 absolute inset-0 rounded-lg z-[1]" />
                <div className="z-[2] relative">
                    <h1 className="text-xl font-medium"><T keyName={Greeting} /> {props?.user?.fullname || props?.user?.username}!</h1>
                </div>
            </div>

            <div className="flex justify-center lg:mt-8 mt-4">
                <div className="w-8 h-8 border-2 border-white/50 rounded-full animate-spin" />
            </div>

            <p className="text-xl text-center mt-4">
                <T keyName={"loading"} />
            </p>
        </>);
    }

    return (<>
        <NextSeo title="Friends - Feed" />

        <Map
            positions={
                FriendsPosts
                    ?.map((friendPosts, index) => {
                        return friendPosts.posts.map(post => (
                            post.location ? {
                                position: [
                                    post.location?.latitude,
                                    post.location?.longitude,
                                ],
                                username: friendPosts.user.username,
                                profilePicture: friendPosts.user.profilePicture.url,
                            } : null
                        ))
                    })
                    .flat(1)
                    .filter(Boolean)
            }
        />
    </>)
};

export async function getServerSideProps({ req, res }) {
    const authCheck = await checkAuth(req, res);
    if (authCheck) return authCheck;

    return {
        props: {
            user: JSON.parse(getCookie("user", { req, res }))
        }
    };
};
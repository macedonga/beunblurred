import axios from "axios";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { getCookie, hasCookie, deleteCookie, setCookie } from "cookies-next";

import Link from "next/link";
import { NextSeo } from "next-seo";
import checkAuth from "@/utils/checkAuth";
import { T, useTranslate } from "@tolgee/react";
import { requestAuthenticated } from "@/utils/requests";

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

export default function Memories(props) {
    const { t } = useTranslate();
    const [Greeting, setGreeting] = useState(t("gm"));
    const [Data, setData] = useState(
        // really lazy way to fix the sorting issue lol
        (props?.feed || [])?.sort((a, b) => {
            return new Date(b.memoryDay) + new Date(a.memoryDay);
        })?.map((post) => ({
            ...post,
            posts: [
                post
            ],
            user: props?.user,
        }))
    );

    useEffect(() => {
        var today = new Date()
        var curHr = today.getHours()
        let greeting;

        if (curHr < 12) greeting = "gm";
        else if (curHr < 18) greeting = "ga";
        else if (curHr < 21) greeting = "ge";
        else greeting = "gn";

        setGreeting(greeting);
    }, []);

    return (<>
        <NextSeo title="Memories - Feed" />

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
                <p className="text-sm text-white/70">
                    {Data.length} <T keyName="userMemoriesSubtitle" />
                </p>
            </div>
        </div>

        <div
            className={"grid lg:gap-y-8 gap-y-4 lg:mt-8 mt-4"}
        >
            {
                Data?.map((friendPost, index) => (
                    <PostComponent
                        key={index}
                        data={friendPost}
                        locale={props.locale}
                        isMemory={true}
                    />
                ))
            }
        </div>
    </>)
}

export async function getServerSideProps({ req, res }) {
    let authCheck = await checkAuth(req, res);
    if (authCheck) return authCheck;

    let feed = (await (requestAuthenticated("feeds/memories-v1", req, res).then(r => r.data.data))).map(e => ({
        id: e.mainPostMemoryId,
        memoryDay: e.memoryDay,
        isLate: e.isLate,
        primary: e.mainPostPrimaryMedia,
        secondary: e.mainPostSecondaryMedia,
        thumbnail: e.mainPostThumbnail,
        momentId: e.momentId,
        numPostsForMoment: e.numPostsForMoment,
    }));

    for (const post of feed.filter(e => e.numPostsForMoment > 1)) {
        let posts = (await (requestAuthenticated("feeds/memories-v1/" + post.momentId, req, res).then(r => r.data.posts))).reverse();
        let i = feed.findIndex(e => e.id === post.id);
        feed.splice(i, 1, ...posts);
    }

    return {
        props: {
            feed: JSON.parse(JSON.stringify(feed)),
            user: JSON.parse(getCookie("user", { req, res }))
        }
    };
};
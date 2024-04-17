import axios from "axios";
import { useEffect, useState } from "react";
import { getCookie, hasCookie, deleteCookie, setCookie } from "cookies-next";

import PostComponent from "../components/PostComponent";
import { requestAuthenticated } from "@/utils/requests";
import { NextSeo } from "next-seo";
import Link from "next/link";
import { T, useTranslate } from "@tolgee/react";
import checkAuth from "@/utils/checkAuth";

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
            className="relative p-4 rounded-lg"
            style={{
                backgroundImage: `url(${props?.user?.profilePicture?.url})`,
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

    return {
        props: {
            feed: await (requestAuthenticated("feeds/memories", req, res).then(r => r.data.data)),
            user: JSON.parse(getCookie("user", { req, res }))
        }
    };
};
import axios from "axios";
import { useEffect, useState } from "react";
import { getCookie, hasCookie, deleteCookie, setCookie } from "cookies-next";

import PostComponent from "../components/PostComponent";
import { NextSeo } from "next-seo";
import Link from "next/link";
import { T, useTranslate } from "@tolgee/react";

export default function Feed(props) {
    const { t } = useTranslate();
    const [Greeting, setGreeting] = useState(t("gm"));
    const [Data, setData] = useState({});
    const [ShowNoBeRealWarning, setShowNoBeRealWarning] = useState(false);
    const [Loading, setLoading] = useState(false);

    const fetchData = async () => {
        if (Data.next === null && Data.posts.length > 0) return alert("No more posts to load.");

        if (Loading) return;
        try {
            setLoading(true);
            const { data } = await axios.get("/api/fof" + (Data.next ? ("?next=" + Data.next) : ""));

            if (data.data.length === 0 && !Data.posts) {
                setShowNoBeRealWarning(true);
                setLoading(false);
                return;
            }

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
            console.error("Error while fetching FOF data:", error);
            setLoading(false);
            alert(t("fofFetchError"));
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
        fetchData();
    }, []);

    return (<>
        <NextSeo title="Friends of Friends - Feed" />

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
                    <T keyName="fofBerealFeed" />
                </p>
            </div>
        </div>

        <div
            className={"grid lg:gap-y-8 gap-y-4 lg:mt-8 mt-4"}
        >
            {
                Data.posts?.map((friendPost, index) => (
                    <PostComponent
                        key={index}
                        data={friendPost}
                        locale={props.locale}
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

            {
                ShowNoBeRealWarning && (<>
                    <p className="text-white/75 text-center">
                        <b>
                            <T keyName="noBeRealWarningFoF" />
                        </b>
                    </p>
                    <p className="text-white/75 text-center">
                        <T keyName="noBeRealWarningFoFDesc" params={{ b: <b /> }} />
                    </p>
                    <p className="text-white/75 text-center">
                        <T keyName="noBeRealWarningFoFDesc2" />
                    </p>
                </>)
            }

            {
                !(ShowNoBeRealWarning || (Data.next === null && Data.posts?.length > 0) || (Loading && Data.posts?.length === 0)) && (
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
                        {t("loadMore")}
                    </button>
                )
            }
        </div>
    </>)
}

export async function getServerSideProps({ req, res }) {
    const requiredCookies = [
        "token",
        "refreshToken",
        "tokenType",
        "tokenExpiration",
    ];
    const data = [];

    if (!hasCookie("testMode", { req, res }) && requiredCookies.map(n => hasCookie(n, { req, res })).includes(false)) {
        requiredCookies.forEach(n => deleteCookie(n, { req, res }))
        return {
            redirect: {
                destination: "/",
                permanent: false
            }
        };
    }

    return {
        props: {
            user: JSON.parse(getCookie("user", { req, res }))
        }
    };
};
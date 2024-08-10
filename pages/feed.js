import axios from "axios";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { getCookie, hasCookie, deleteCookie, setCookie } from "cookies-next";

import { requestAuthenticated } from "@/utils/requests";
import { NextSeo } from "next-seo";
import Link from "next/link";
import { T, useTranslate } from "@tolgee/react";
import checkAuth from "@/utils/checkAuth";

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
    const [ShouldShowDonationBox, setShouldShowDonationBox] = useState(false);
    const [ShowArchiverBox, setShowArchiverBox] = useState(false);
    const [Data, setData] = useState({
        ...props.feed
    });

    const fetchFeed = async () => {
        setLoading(true);
        const res = await axios.get("/api/feed");
        setData(res.data);
        setLoading(false);
    };

    useEffect(() => {
        if (window) {
            setShouldShowDonationBox(!!!localStorage.getItem("donationDismissed"));
            setShowArchiverBox(!!!localStorage.getItem("archiverDismissed"));
        }

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

    const updateCredentials = async () => {
        try {
            setLoading(true);
            await axios.get(`/api/archiver/updateCreds`);
            setData(o => ({
                ...o,
                showUpdateCredsAlert: false
            }))
            alert("Credentials updated succesfully!");
        } catch {
            alert("An error occured while updating credentials.");
        }
        setLoading(false);
    };

    return (<>
        <NextSeo title="Friends - Feed" />

        {
            ShouldShowDonationBox && (
                <div className="rounded-lg bg-white/5 border-2 border-white/10 flex flex-col items-center lg:mb-8 mb-4">
                    <div className="p-4">
                        <p className="text-center text-xl font-semibold">
                            <T keyName="donationTitleFeed" />
                        </p>

                        <p className="text-center text-sm mt-2">
                            <T keyName="donationTitle" />
                        </p>
                    </div>
                    <div className="flex w-full divide-white/5 border-t-2 border-white/10 divide-x-2">
                        <Link
                            href="/donate"
                            className="bg-white/5 p-2 rounded-bl-md text-center w-full grid place-items-center text-sm font-semibold"
                        >
                            <T keyName="donateNow" />
                        </Link>
                        <button
                            onClick={() => {
                                localStorage.setItem("donationDismissed", "true");
                                setShouldShowDonationBox(false);
                            }}
                            className="bg-white/5 p-2 rounded-br-md text-center w-full grid place-items-center text-sm"
                        >
                            <T keyName="dontDonate" />
                        </button>
                    </div>
                </div>
            )
        }

        {
            ShowArchiverBox && (
                <div className="rounded-lg bg-white/5 border-2 border-white/10 flex flex-col items-center lg:mb-8 mb-4">
                    <div className="p-4">
                        <p className="text-center text-xl font-semibold">
                            <T keyName="archiverTitleFeed" />
                        </p>

                        <p className="text-center text-sm mt-2">
                            <T keyName="archiverTitleFeedSubtitle" />
                        </p>
                    </div>
                    <div className="flex w-full divide-white/5 border-t-2 border-white/10 divide-x-2">
                        <Link
                            href="/archiver"
                            className="bg-white/5 p-2 rounded-bl-md text-center w-full grid place-items-center text-sm font-semibold"
                        >
                            <T keyName="archiveSubscribeNow" />
                        </Link>
                        <button
                            onClick={() => {
                                localStorage.setItem("archiverDismissed", "true");
                                setShowArchiverBox(false);
                            }}
                            className="bg-white/5 p-2 rounded-br-md text-center w-full grid place-items-center text-sm"
                        >
                            <T keyName="dontDonate" />
                        </button>
                    </div>
                </div>
            )
        }

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
                    {Data?.friendsPosts?.length} <T keyName="friendsPostedBereal" />
                </p>
            </div>
        </div>

        {Data.showUpdateCredsAlert &&
            <button
                disabled={Loading}
                onClick={updateCredentials}
                className={`
                    px-4 py-2 bg-red-500/10 rounded-lg transition-all border-2 border-red-500/10
                    disabled:opacity-50 disabled:cursor-not-allowed mt-4 outline-none w-full
                `}
            >
                <p>
                    <T keyName={Loading ? "loading" : "fixLoginTitle"} />
                </p>
                <p className="text-sm opacity-75"><T keyName="fixLoginSubtitle" /></p>
            </button>
        }

        <div
            className={"grid lg:gap-y-8 gap-y-4 lg:mt-8 mt-4"}
        >
            {
                Data?.friendsPosts?.map((friendPost, index) => (
                    <PostComponent
                        key={index}
                        data={friendPost}
                        locale={props.locale}
                    />
                ))
            }
        </div>
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
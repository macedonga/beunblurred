import axios from "axios";
import { useEffect, useState } from "react";
import { getCookie, hasCookie, deleteCookie, setCookie } from "cookies-next";

import Link from "next/link";
import { NextSeo } from "next-seo";
import checkAuth from "@/utils/checkAuth";
import { T, useTranslate } from "@tolgee/react";
import { requestAuthenticated } from "@/utils/requests";

export default function Feed(props) {
    const { t } = useTranslate();
    const [Data, setData] = useState({
        data: [],
        notLoaded: true
    });
    const [Loading, setLoading] = useState(false);
    const [Greeting, setGreeting] = useState(t("gm"));
    const [SearchQuery, setSearchQuery] = useState("");
    const [SearchTimeout, setSearchTimeout] = useState(null);

    const search = async () => {
        if (SearchQuery.length < 3) return;

        try {
            setLoading(true);
            const res = await axios.get("/api/search?q=" + encodeURIComponent(SearchQuery));
            setData(res.data);
            setLoading(false);
        } catch (e) {
            setLoading(false);
            setData({
                data: [],
                notLoaded: false,
                success: false
            })
            console.error(e);
            alert("An error occurred while searching for users.");
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
    }, []);

    const changeSearch = (v) => {
        setSearchQuery(v);
        if (SearchTimeout) clearTimeout(SearchTimeout);

        if (v.length < 3) return;

        setSearchTimeout(setTimeout(() => {
            search();
        }, 500));
    };

    return (<>
        <NextSeo title="Search users" />

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
                    <T keyName="searchSubtitle" />
                </p>
            </div>
        </div>


        <div
            className={"grid gap-y-2 mt-4"}
        >
            <input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={SearchQuery}
                onChange={e => changeSearch(e.target.value)}
                className={`
                    bg-white/5 relative border-2 border-white/10
                    rounded-lg py-3 px-4 flex items-center
                    min-w-0 overflow-hidden outline-none placeholder:text-white/50
                `}
            />

            {
                Loading && (<>
                    <div className="flex justify-center mt-4">
                        <div className="w-8 h-8 border-2 border-white/50 rounded-full animate-spin" />
                    </div>

                    <p className="text-center">
                        <T keyName={"loading"} />
                    </p>
                </>)
            }

            {
                !Loading && !Data.notLoaded && (
                    Data.data.length > 0 ? (<>
                        <h1 className="text-2xl text-center my-2 font-medium">
                            <T keyName={"searchResults"} />
                        </h1>

                        {
                            Data.data.map((u, i) => (
                                <Link
                                    key={u.id}
                                    href={"/u/" + u.id}
                                    className={
                                        `
                                            bg-white/5 relative border-2 border-white/10
                                            rounded-lg py-3 px-4 flex items-center
                                            min-w-0 overflow-hidden
                                        `
                                    }
                                >
                                    {
                                        u.profilePicture?.url ?
                                            <img
                                                className="w-16 h-16 rounded-lg border-black border-2 mr-6"
                                                src={u.profilePicture?.url}
                                                alt="Profile picture"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = "https://cdn.caards.co/assets/default-avatar.png";
                                                }}
                                            /> :
                                            <div className="w-16 h-16 rounded-lg bg-white/5 relative border-full border-black justify-center align-middle flex mr-6">
                                                <div className="m-auto text-2xl uppercase font-bold">{u.username.slice(0, 1)}</div>
                                            </div>
                                    }

                                    <p className="text-base leading-5 text-white">
                                        {u.fullname || "@" + u.username}
                                        {
                                            u.fullname && <>
                                                <span className="ml-2 opacity-75">
                                                    {"@" + u.username}
                                                </span>
                                            </>
                                        }

                                        <br />
                                        <span className="text-xs opacity-75">
                                            {u.mutualFriends} <T keyName="commonFriends" />
                                        </span>
                                    </p>
                                </Link>
                            ))
                        }
                    </>) : !Data.success ? (<>
                        <p className="text-center mt-4">
                            <T keyName={"error500Title"} />
                        </p>
                    </>) : (<>
                        <p className="text-center mt-4">
                            <T keyName={"searchNoResults"} />
                        </p>
                    </>)
                )
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
import axios from "axios";
import { useEffect, useState } from "react";
import { getCookie, hasCookie, deleteCookie, setCookie } from "cookies-next";

import PostComponent from "../components/PostComponent";
import { NextSeo } from "next-seo";
import Link from "next/link";
import { T, useTranslate } from "@tolgee/react";

export default function Discovery(props) {
    const { t } = useTranslate();
    const [Greeting, setGreeting] = useState(t("gm"));
    const [Data, setData] = useState([]);
    const [Loading, setLoading] = useState(false);
    const [FirstLoadNotWorking, setFirstLoadNotWorking] = useState(false);

    const fetchDiscovery = async () => {
        if (Loading || FirstLoadNotWorking) return;
        try {
            setLoading(true);
            const { data: { data } } = await axios.get("/api/discovery");

            setData(o => {
                let newData = [...o, ...data];

                newData = newData.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);

                return newData;
            });
            setLoading(false);
        } catch (error) {
            console.error("Error while fetching discovery data:", error);
            setLoading(false);
            if (Data.length === 0) setFirstLoadNotWorking(true);
            else alert(t("discoveryFetchError"));
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
        fetchDiscovery();

        if (window) {
            window.addEventListener("scroll", (e) => {
                if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 250) {
                    fetchDiscovery();
                }
            });
        }

        return () => {
            if (window) {
                window.removeEventListener("scroll", (e) => {
                    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 250) {
                        fetchDiscovery();
                    }
                });
            }
        };
    }, []);

    return (<>
        <NextSeo title="Discovery - Feed" />

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
                    <T keyName="discoveryFeedSubtitle" />
                </p>
            </div>
        </div>

        <div
            className={"grid lg:gap-y-8 gap-y-4 lg:mt-8 mt-4"}
        >
            {
                Data.map((post, index) => (
                    <PostComponent
                        key={index}
                        data={post}
                        isDiscovery={true}
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
                FirstLoadNotWorking && (<>
                    <p className="text-white/75 text-center">
                        <b>
                            {t("discoveryFetchError")}
                        </b>
                    </p>
                    <p className="text-white/75 text-center">
                        {t("discoveryFetchErrorSub")}
                    </p>
                </>)
            }
        </div>
    </>)
}

export async function getServerSideProps({ req, res }) {
    const requiredCookies = [
        "token",
        "refreshToken",
        "tokenType",
        "tokenExpiration"
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
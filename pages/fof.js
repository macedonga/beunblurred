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

export async function getServerSideProps({ req, res, query }) {
    const requiredCookies = [
        "token",
        "refreshToken",
        "tokenType",
        "tokenExpiration",
        "user"
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

    return {
        props: {
            user: JSON.parse(atob(getCookie("user", { req, res })))
        }
    };
};
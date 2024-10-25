import { useRouter } from "next/router";
import { NextSeo } from "next-seo";
import Image from "next/image";
import Link from "next/link";

import axios from "axios";
import { useEffect, useState } from "react";
import { getCookie, hasCookie, deleteCookie, setCookie } from "cookies-next";

import { requestAuthenticated } from "@/utils/requests";
import { T, useTranslate } from "@tolgee/react";
import checkAuth from "@/utils/checkAuth";
import Popup from "@/components/Popup";
import clientPromise from "@/utils/mongo";
import ArchiverPostComponent from "@/components/ArchiverPostComponent";

export default function ArchiverPostPage({
    user,
    posts,
    locale
}) {
    const router = useRouter();

    return (<>
        <NextSeo title={`${posts[0]?.from?.username} archived posts`} />

        <h1 className="text-3xl font-semibold text-center mb-8">
            <T keyName="archiverFeedUserTitle" params={{ user: posts[0]?.from?.username }} />
        </h1>

        <div className="grid lg:gap-y-8 gap-y-4 lg:mt-8 mt-4">
            {
                posts?.map((post, index) => (
                    <ArchiverPostComponent
                        key={index}
                        data={post}
                        locale={locale}
                    />
                ))
            }
        </div>

        <Link href={router.query?.fromUserPage ? `/u/${posts[0].uid}` : "/archiver"}>
            <button
                className={`
                    px-4 py-2 bg-white/5 rounded-lg transition-all border-2 border-white/10
                    disabled:opacity-50 disabled:cursor-not-allowed mt-4 outline-none w-full
                `}
            >
                <T keyName={router.query?.fromUserPage ? "backToFeed" : "backArchiverMenu"} />
            </button>
        </Link>
    </>)
};

export async function getServerSideProps({ req, res, params }) {
    const authCheck = await checkAuth(req, res);
    if (authCheck) return authCheck;

    if (process.env.NEXT_PUBLIC_NO_ARCHIVER) {
        return {
            redirect: {
                destination: "/feed",
                permanent: false
            }
        };
    }

    const user = await requestAuthenticated("person/me", req, res);

    const db = (await clientPromise).db();
    const users = db.collection("users");
    const posts = db.collection("posts");

    var userFromDb = await users.findOne({ id: user.data.id });

    if (!userFromDb) {
        return {
            redirect: {
                destination: "/archiver/signup",
                permanent: false
            }
        }
    }

    const postsFromDb = (await posts.find({
        for: { $in: [user.data.id] },
        uid: params.id,
    }).toArray())?.map(post => {
        delete post._id;
        delete post.for;
        delete post.date;
        return post;
    })?.sort((a, b) => {
        const latestDateA = new Date(Math.max(...a.posts.map(d => new Date(d.takenAt))));
        const latestDateB = new Date(Math.max(...b.posts.map(d => new Date(d.takenAt))));

        return latestDateB - latestDateA;
    });

    if (!postsFromDb || postsFromDb.length == 0) {
        return {
            notFound: true
        };
    }

    return {
        props: {
            user: JSON.parse(getCookie("user", { req, res })),
            posts: postsFromDb,
        }
    };
};
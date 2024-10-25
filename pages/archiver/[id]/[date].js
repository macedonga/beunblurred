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
    post,
    date,
    locale
}) {
    const router = useRouter();

    return (<>
        <NextSeo title={`${post.from?.username} post from ${new Date(date).toLocaleDateString("en-US", {
            day: "numeric",
            month: "long",
            year: "numeric"
        }) }`} />

        <h1 className="text-3xl font-semibold text-center mb-8">
            <T keyName="archiverPostTitle" />
        </h1>

        <ArchiverPostComponent
            data={post}
            locale={locale}
            showFeedButton={true}
        />

        <Link href={router.query?.fromUserPage ? `/u/${post.uid}` : "/archiver"}>
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

    var date = params.date;
    if (date === "today") {
        date = new Date();
    } else {
        try {
            date = new Date(date);
        } catch (e) {
            return {
                notFound: true
            };
        }
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const postFromDb = await posts.findOne({
        for: { $in: [user.data.id] },
        uid: params.id,
        date: {
            $gte: startOfDay,
            $lt: endOfDay
        }
    });

    if (!postFromDb) {
        return {
            notFound: true
        };
    }

    delete postFromDb.for;
    delete postFromDb._id;
    delete postFromDb.date;

    return {
        props: {
            user: JSON.parse(getCookie("user", { req, res })),
            post: postFromDb,
            date: date.toString()
        }
    };
};
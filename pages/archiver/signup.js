import { useRouter } from "next/router";
import { NextSeo } from "next-seo";
import Image from "next/image";
import Link from "next/link";

import axios from "axios";
import { useEffect, useState } from "react";
import { getCookie, hasCookie, deleteCookie, setCookie } from "cookies-next";

import { requestAuthenticated } from "@/utils/requests";
import { T, useTranslate } from "@tolgee/react";
import clientPromise from "@/utils/mongo";
import checkAuth from "@/utils/checkAuth";
import Popup from "@/components/Popup";

export default function ArchiverSignupPage({
    user,
}) {
    const router = useRouter();

    const signup = async () => {
        const res = await axios.get("/api/archiver/signup");

        if (res.status === 200) {
            router.push("/archiver");
        } else {
            alert("An error occured. Please try again later");
        }
    };

    return (<>
        <NextSeo title="Sign up for archiver" />

        <h1 className="text-3xl font-semibold text-center">
            <T keyName="archiverSignupTitle" />
        </h1>
        <p className="text-center mt-2">
            <T keyName="archiverSignupSubtitle" />
        </p>

        <button
            className={`
                px-4 py-2 bg-white/5 rounded-lg transition-all border-2 border-white/10
                disabled:opacity-50 disabled:cursor-not-allowed mt-4 outline-none w-full
            `}
            onClick={signup}
        >
            <div className="flex items-center justify-center">
                <p className="text-xl font-medium"><T keyName={"signupCta"} /></p>
            </div>

            <p className="text-sm opacity-75"><T keyName="signupCtaSubtitle" /></p>
        </button>
        <p className="text-center mt-4 opacity-75 text-sm">
            <T keyName="signupPrivacyAndToSSubtitle" />
        </p>
    </>)
};

export async function getServerSideProps({ req, res }) {
    const authCheck = await checkAuth(req, res);
    if (authCheck) return authCheck;

    const user = await requestAuthenticated("person/me", req, res);

    const db = (await clientPromise).db();
    const users = db.collection("users");
    const posts = db.collection("posts");

    var userFromDb = await users.findOne({ id: user.data.id });

    if (userFromDb) {
        return {
            redirect: {
                destination: "/archiver",
                permanent: false
            }
        }
    }

    return {
        props: {
            user: JSON.parse(getCookie("user", { req, res })),
        }
    };
};
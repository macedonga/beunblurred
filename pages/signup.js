import axios from "axios";
import { useEffect, useState } from "react";
import { getCookie, hasCookie, deleteCookie, setCookie } from "cookies-next";

import PostComponent from "../components/PostComponent";
import { requestAuthenticated } from "@/utils/requests";
import { NextSeo } from "next-seo";
import Link from "next/link";
import { T, useTranslate } from "@tolgee/react";
import checkAuth from "@/utils/checkAuth";
import Image from "next/image";

export default function Signup(props) {
    return (<>
        <NextSeo title="Signup" />

        <h1 className="text-3xl font-semibold text-center">
            <T keyName="signupTitle" />
        </h1>
        <p className="text-center mt-2">
            <T keyName="signupDescription" />
        </p>

        <button
            className={`
                    px-4 py-2 bg-white/5 rounded-lg transition-all
                    disabled:opacity-50 disabled:cursor-not-allowed mt-4
                    focus:ring-2 focus:ring-white/20 outline-none w-full
                `}
        >
            <T keyName="signupButton" />
        </button>

        <p className="mt-2 text-center text-sm opacity-75">
            <T keyName="signupDisclaimer" />
        </p>    
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